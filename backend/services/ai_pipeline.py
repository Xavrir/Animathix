import asyncio
import json
import logging
import textwrap

from openai import APIConnectionError, APIError, APITimeoutError, OpenAI, RateLimitError
from pydantic import ValidationError

from backend.config import settings
from backend.models.schemas import NarrationPlan, ScenePlan
from backend.prompts.coder import CODER_SYSTEM_PROMPT
from backend.prompts.planner import PLANNER_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

_client: OpenAI | None = None
RETRYABLE_OPENROUTER_ERRORS = (
    APIConnectionError,
    APIError,
    APITimeoutError,
    RateLimitError,
)


def _strip_code_fences(text: str) -> str:
    stripped = text.strip()
    if not stripped.startswith("```"):
        return stripped

    lines = stripped.splitlines()
    if lines and lines[0].startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].strip() == "```":
        lines = lines[:-1]
    return "\n".join(lines).strip()


def _extract_message_content(response) -> str:
    if getattr(response, "error", None):
        error = response.error
        if isinstance(error, dict):
            message = error.get("message") or error
        else:
            message = str(error)
        raise RuntimeError(f"OpenRouter returned an error payload: {message}")

    if not response.choices:
        raise RuntimeError("OpenRouter returned no completion choices")

    message = response.choices[0].message
    content = message.content

    if isinstance(content, str) and content.strip():
        return content

    if isinstance(content, list):
        text_parts: list[str] = []
        for part in content:
            if isinstance(part, dict):
                text = part.get("text")
            else:
                text = getattr(part, "text", None)
            if text:
                text_parts.append(text)

        if text_parts:
            return "\n".join(text_parts)

    raise RuntimeError("OpenRouter returned an empty completion message")


async def _request_completion(
    *,
    model: str,
    messages: list[dict[str, str]],
    temperature: float,
    max_tokens: int,
    extra_kwargs: dict | None = None,
):
    client = _get_client()
    last_error: Exception | None = None
    extra_kwargs = extra_kwargs or {}

    for attempt in range(5):
        try:
            return await asyncio.to_thread(
                client.chat.completions.create,
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                timeout=settings.OPENROUTER_TIMEOUT,
                **extra_kwargs,
            )
        except RETRYABLE_OPENROUTER_ERRORS as exc:
            last_error = exc
            if attempt == 4:
                break

            wait_seconds = min(2 + attempt * 2, 8)
            logger.warning(
                "OpenRouter request failed (attempt %d/5): %s. Retrying in %ds.",
                attempt + 1,
                exc,
                wait_seconds,
            )
            await asyncio.sleep(wait_seconds)

    raise RuntimeError(f"OpenRouter request failed after retries: {last_error}")


def _parse_plan_response(raw: str) -> NarrationPlan:
    candidate = _strip_code_fences(raw)
    plan_data = json.loads(candidate)

    while isinstance(plan_data, str):
        candidate = _strip_code_fences(plan_data)
        plan_data = json.loads(candidate)

    if not isinstance(plan_data, dict):
        raise ValueError(
            f"Planner response must be a JSON object, got {type(plan_data).__name__}"
        )

    return NarrationPlan.model_validate(plan_data)


def _wrap_lines(text: str, width: int) -> list[str]:
    collapsed = " ".join(text.split())
    if not collapsed:
        return [""]
    return textwrap.wrap(collapsed, width=width) or [collapsed]


def _identify_known_topic(text: str) -> str | None:
    lowered = text.lower()

    if (
        "derivative" in lowered
        or "differentiat" in lowered
        or "tangent line" in lowered
    ):
        return "derivative"

    if "integral" in lowered or "area under the curve" in lowered:
        return "integral"

    if "pythagorean" in lowered or "right triangle" in lowered:
        return "pythagorean"

    if (
        "divergence theorem" in lowered
        or "gauss theorem" in lowered
        or "gaussian theorem" in lowered
    ):
        return "gauss"

    return None


def _infer_visual_mode(text: str) -> str:
    lowered = text.lower()

    if any(
        keyword in lowered
        for keyword in [
            "graph",
            "function",
            "curve",
            "slope",
            "rate",
            "change",
            "equation",
            "axis",
        ]
    ):
        return "graph"

    if any(
        keyword in lowered
        for keyword in [
            "triangle",
            "circle",
            "angle",
            "shape",
            "area",
            "length",
            "geometry",
            "distance",
        ]
    ):
        return "geometry"

    if any(
        keyword in lowered
        for keyword in [
            "count",
            "probability",
            "combin",
            "case",
            "arrange",
            "discrete",
            "odds",
        ]
    ):
        return "discrete"

    return "comparison"


def _build_known_fallback_plan(content: str) -> NarrationPlan | None:
    topic = _identify_known_topic(content)

    if topic == "derivative":
        return NarrationPlan(
            title="What a Derivative Measures",
            concept_summary=(
                "A derivative measures instantaneous rate of change. On a graph, it tells us how steep "
                "the curve is at one specific point."
            ),
            prerequisite_concepts=[
                "Functions map x-values to y-values",
                "Points on a graph",
                "Average rate of change",
            ],
            scenes=[
                ScenePlan(
                    scene_number=1,
                    narration_text=(
                        "A derivative answers a very specific question: if we zoom in on one point of a graph, "
                        "how fast is the output changing right there?"
                    ),
                    visual_description="Introduce a curve and highlight one point where we want to measure steepness.",
                    manim_hints=[
                        "Use Text",
                        "Use Axes",
                        "Highlight one point on the graph",
                    ],
                ),
                ScenePlan(
                    scene_number=2,
                    narration_text=(
                        "We start with average change between two nearby points. That gives a secant line whose "
                        "slope tells us how much y changes compared with x over an interval."
                    ),
                    visual_description="Show two points on a curve connected by a secant line, with rise and run emphasized.",
                    manim_hints=[
                        "Use Axes",
                        "Use Dot",
                        "Use Line",
                        "Animate the secant line",
                    ],
                ),
                ScenePlan(
                    scene_number=3,
                    narration_text=(
                        "Now bring those two points closer together. The secant line settles into a tangent line, "
                        "and that tangent slope is the derivative at the point."
                    ),
                    visual_description="Transform a secant line into a tangent line as the interval shrinks.",
                    manim_hints=[
                        "Transform the secant into a tangent",
                        "Keep the focus on local steepness",
                    ],
                ),
                ScenePlan(
                    scene_number=4,
                    narration_text=(
                        "So the derivative is not just a formula rule. It is a visual measurement of local change: "
                        "how steep the graph is, right now."
                    ),
                    visual_description="End with a short takeaway card tying tangent slope to instantaneous change.",
                    manim_hints=[
                        "Use Text",
                        "Use summary card",
                        "Fade out to a clear takeaway",
                    ],
                ),
            ],
        )

    if topic == "integral":
        return NarrationPlan(
            title="What an Integral Represents",
            concept_summary=(
                "An integral adds up many tiny contributions. Geometrically, it is the accumulated area under a curve."
            ),
            prerequisite_concepts=[
                "Functions on axes",
                "Area of rectangles",
                "Summing many small pieces",
            ],
            scenes=[
                ScenePlan(
                    scene_number=1,
                    narration_text="An integral measures accumulation. It tells us what we get when many tiny pieces are added together.",
                    visual_description="Introduce a curve over an interval and shade the region beneath it.",
                    manim_hints=["Use Axes", "Shade area", "Use Text"],
                ),
                ScenePlan(
                    scene_number=2,
                    narration_text="We can approximate that area with rectangles. Each rectangle is simple, and the sum of all of them estimates the total.",
                    visual_description="Show a few wide rectangles under the curve, then more and thinner rectangles.",
                    manim_hints=["Use bars or rectangles", "Animate refinement"],
                ),
                ScenePlan(
                    scene_number=3,
                    narration_text="As the rectangles get thinner, the estimate gets better. In the limit, that accumulated area is the integral.",
                    visual_description="Refine the partition until the area approximation hugs the curve.",
                    manim_hints=["Use Transform", "Focus on accumulation"],
                ),
            ],
        )

    if topic == "pythagorean":
        return NarrationPlan(
            title="Why the Pythagorean Theorem Works",
            concept_summary=(
                "The Pythagorean theorem says the area built on the hypotenuse matches the combined areas built on the other two sides."
            ),
            prerequisite_concepts=[
                "Right triangles",
                "Squares and area",
                "Side lengths",
            ],
            scenes=[
                ScenePlan(
                    scene_number=1,
                    narration_text="Start with a right triangle and build a square on each of its three sides.",
                    visual_description="Display a right triangle with three attached squares in different colors.",
                    manim_hints=["Use Polygon", "Use Square", "Color-code the shapes"],
                ),
                ScenePlan(
                    scene_number=2,
                    narration_text="The theorem says the two smaller square areas together exactly match the largest square area.",
                    visual_description="Highlight the two smaller squares, then the larger square, to compare their areas.",
                    manim_hints=["Use area highlights", "Transform shapes"],
                ),
                ScenePlan(
                    scene_number=3,
                    narration_text="So the relationship a squared plus b squared equals c squared is really a statement about area, not just symbols.",
                    visual_description="End with a compact visual summary connecting lengths to square areas.",
                    manim_hints=["Use Text", "Use final summary card"],
                ),
            ],
        )

    if topic == "gauss":
        return NarrationPlan(
            title="Gauss's Theorem, Visually",
            concept_summary=(
                "Gauss's theorem links what happens inside a region to what flows out through its boundary surface."
            ),
            prerequisite_concepts=[
                "Vector fields",
                "Flux through a surface",
                "Volumes and boundaries",
            ],
            scenes=[
                ScenePlan(
                    scene_number=1,
                    narration_text="Imagine a vector field filling space and a closed surface surrounding part of that field.",
                    visual_description="Show arrows in space and a boundary enclosing a region.",
                    manim_hints=["Use Arrow", "Use closed outline", "Use depth cues"],
                ),
                ScenePlan(
                    scene_number=2,
                    narration_text="Gauss's theorem says total outward flux through the boundary matches the total divergence accumulated inside the region.",
                    visual_description="Compare outward arrows crossing the surface with source strength inside the region.",
                    manim_hints=["Highlight boundary flow", "Highlight source regions"],
                ),
                ScenePlan(
                    scene_number=3,
                    narration_text="So instead of measuring every tiny source directly, we can read the same information from the boundary flow.",
                    visual_description="End with a side-by-side summary of inside behavior versus boundary flux.",
                    manim_hints=["Use comparison layout", "Use concise summary card"],
                ),
            ],
        )

    return None


def generate_fallback_plan(content: str) -> NarrationPlan:
    """Build a simple plan when the planner model is unavailable."""
    cleaned = " ".join(content.split()) or "this math concept"
    known_plan = _build_known_fallback_plan(cleaned)
    if known_plan is not None:
        return known_plan

    short_topic = cleaned[:80].rstrip(" ,.;:")
    title = short_topic[:60] if len(short_topic) > 60 else short_topic
    mode = _infer_visual_mode(cleaned)

    if mode == "graph":
        simplest_visual = "Show one simple curve on Axes and mark a single point or interval that the viewer should focus on first."
        shift_visual = "Reframe the same graph from a new viewpoint: compare local vs global behavior, or transform a moving secant/marker into the key insight."
        mistake_visual = "Show the tempting but wrong graph reading, then contrast it with the correct interpretation using color and annotation."
        hints = ["Use Axes", "Use Dot", "Use Line", "Use Transform"]
    elif mode == "geometry":
        simplest_visual = "Start with one concrete geometric figure and label only the one or two lengths, angles, or areas that matter."
        shift_visual = "Rearrange, rotate, or decompose the same figure so the hidden relationship becomes obvious from the new view."
        mistake_visual = "Show a plausible but wrong geometric intuition, then correct it by highlighting the exact part of the diagram that was overlooked."
        hints = ["Use Polygon", "Use Line", "Use Angle", "Use VGroup"]
    elif mode == "discrete":
        simplest_visual = "Show a very small concrete case first — just a few objects, slots, or outcomes that can be tracked individually."
        shift_visual = "Group or reorganize the same cases so a pattern becomes visible instead of being counted one-by-one."
        mistake_visual = "Show the naive counting or comparison method, then contrast it with the correct grouping or case split."
        hints = ["Use VGroup", "Use SurroundingRectangle", "Use Arrow", "Use Transform"]
    else:
        simplest_visual = "Show two concrete states side by side with one quantity or relationship highlighted so the question is visually clear."
        shift_visual = "Reinterpret the same objects in a different arrangement so the important relationship becomes easier to see."
        mistake_visual = "Contrast the first intuitive reading with the corrected one using side-by-side visuals and a highlighted difference."
        hints = ["Use RoundedRectangle", "Use Arrow", "Use VGroup", "Use Indicate"]

    return NarrationPlan(
        title=title or "Math concept overview",
        concept_summary=(
            f"This video explains {short_topic} by starting with a concrete visual example, "
            "building intuition, and only then stating the key idea clearly."
        ),
        prerequisite_concepts=[
            "Basic algebra",
            "Interpreting diagrams",
            "Following a simple example",
        ],
        scenes=[
            ScenePlan(
                scene_number=1,
                narration_text=(
                    f"Let us start with the real question behind {short_topic}. "
                    "Before naming any rule, we will look at one visual situation and ask what is actually changing or relating."
                ),
                visual_description=(
                    "Open with a visible puzzle or focused question, not a title card. Use one concrete visual and make the unknown visually obvious."
                ),
                manim_hints=[*hints, "Use Text", "Open with a visible question"],
            ),
            ScenePlan(
                scene_number=2,
                narration_text=(
                    "Now reduce the idea to the simplest non-trivial case. "
                    "If we can understand one small example clearly, the larger pattern becomes much easier to trust."
                ),
                visual_description=simplest_visual,
                manim_hints=[*hints, "Keep only the essential objects onscreen"],
            ),
            ScenePlan(
                scene_number=3,
                narration_text=(
                    "Here is the perspective shift. We will look at the same idea in a new way so the relationship stops feeling arbitrary and starts feeling inevitable."
                ),
                visual_description=shift_visual,
                manim_hints=[*hints, "Use Transform or re-layout for the aha moment"],
            ),
            ScenePlan(
                scene_number=4,
                narration_text=(
                    "A common first intuition here is slightly off. Show the tempting wrong interpretation, then make it clear why the correct one works better."
                ),
                visual_description=mistake_visual,
                manim_hints=[
                    *hints,
                    "Use contrast",
                    "Use color to compare wrong vs right",
                ],
            ),
            ScenePlan(
                scene_number=5,
                narration_text=(
                    f"To finish, restate what {short_topic} really means in plain language. "
                    "End with one visual that makes the final takeaway easy to remember."
                ),
                visual_description=(
                    "Show one clean final state that summarizes the key relationship, then add a short plain-language takeaway."
                ),
                manim_hints=[
                    "Use one strong final visual",
                    "Use concise takeaway text",
                    "Avoid a text-only ending",
                ],
            ),
        ],
    )


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = settings.POLLINATIONS_API_KEY or settings.OPENROUTER_API_KEY
        _client = OpenAI(
            base_url=settings.LLM_BASE_URL,
            api_key=api_key,
        )
    return _client


async def generate_plan(content: str) -> NarrationPlan:
    """Call Qwen via OpenRouter to generate a structured narration plan."""
    logger.info("Generating narration plan for: %s", content[:100])

    messages = [
        {"role": "system", "content": PLANNER_SYSTEM_PROMPT},
        {"role": "user", "content": content},
    ]
    planner_model = settings.PLANNER_MODEL or settings.LLM_MODEL
    planner_extra_kwargs = {}
    if "pollinations.ai" in settings.LLM_BASE_URL and planner_model == "qwen-large":
        planner_extra_kwargs["reasoning_effort"] = "low"
    last_error: Exception | None = None

    for attempt in range(3):
        try:
            response = await asyncio.wait_for(
                _request_completion(
                    model=planner_model,
                    messages=messages,
                    temperature=0.2,
                    max_tokens=2048,
                    extra_kwargs=planner_extra_kwargs,
                ),
                timeout=settings.OPENROUTER_TIMEOUT + 15,
            )
        except asyncio.TimeoutError as exc:
            raise RuntimeError(
                f"Planner model {planner_model} timed out after {settings.OPENROUTER_TIMEOUT + 15}s"
            ) from exc
        raw = _extract_message_content(response)
        logger.info("Plan generated, parsing JSON response (attempt %d)", attempt + 1)

        try:
            return _parse_plan_response(raw)
        except (json.JSONDecodeError, ValidationError, ValueError) as exc:
            last_error = exc
            logger.warning(
                "Planner returned invalid JSON on attempt %d: %s",
                attempt + 1,
                exc,
            )
            messages.extend(
                [
                    {"role": "assistant", "content": raw},
                    {
                        "role": "user",
                        "content": (
                            "Your previous response was invalid. Return only a valid JSON object "
                            "that exactly matches the requested schema."
                        ),
                    },
                ]
            )

    raise ValueError(
        f"Planner failed to return valid JSON after 3 attempts: {last_error}"
    )


async def generate_manim_code(
    original_content: str,
    plan: NarrationPlan,
    error_context: str | None = None,
) -> str:
    """Call Qwen via OpenRouter to generate Manim code from a narration plan."""
    user_message = (
        f"The user's original request was:\n{original_content}\n\n"
        f"Generate Manim code for this narration plan:\n\n{plan.model_dump_json(indent=2)}"
    )

    if error_context:
        user_message += (
            f"\n\n--- PREVIOUS ATTEMPT FAILED ---\n"
            f"{error_context}\n"
            f"--- END ERROR ---\n\n"
            f"Fix the code to resolve the error above. Output only the corrected Python code."
        )

    logger.info(
        "Generating Manim code (retry context: %s)",
        "yes" if error_context else "no",
    )

    coder_model = settings.CODER_MODEL or settings.LLM_MODEL

    try:
        response = await asyncio.wait_for(
            _request_completion(
                model=coder_model,
                messages=[
                    {"role": "system", "content": CODER_SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.15,
                max_tokens=3000,
            ),
            timeout=settings.OPENROUTER_TIMEOUT + 45,
        )
    except asyncio.TimeoutError as exc:
        raise RuntimeError(
            f"Coder model {coder_model} timed out after {settings.OPENROUTER_TIMEOUT + 45}s"
        ) from exc

    code = _extract_message_content(response)

    # Strip markdown fences if the model wraps them despite instructions
    if code.startswith("```"):
        lines = code.split("\n")
        # Remove first and last fence lines
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        code = "\n".join(lines)

    return code


def _make_subtitle(text: str, max_chars: int = 70) -> str:
    """Truncate and clean text for on-screen subtitle display."""
    clean = " ".join(text.split()).replace('"', "'")
    if len(clean) > max_chars:
        clean = clean[:max_chars].rsplit(" ", 1)[0] + "..."
    return clean


def _escape(text: str) -> str:
    return (
        text.replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("{", "{{")
        .replace("}", "}}")
        .replace("\n", "\\n")
        .replace("\r", "\\r")
    )


def _generate_derivative_fallback_code(plan: NarrationPlan) -> str:
    if not plan.scenes:
        plan = generate_fallback_plan("derivative")

    title = _escape(plan.title or "What a Derivative Measures")
    summary = _escape(
        plan.concept_summary or "A derivative measures instantaneous rate of change."
    )
    intro = _escape(plan.scenes[0].narration_text)
    secant_narr = _escape(
        plan.scenes[1].narration_text
        if len(plan.scenes) > 1
        else "Average change comes from a secant line."
    )
    tangent_narr = _escape(
        plan.scenes[2].narration_text
        if len(plan.scenes) > 2
        else "As the interval shrinks, the secant becomes a tangent."
    )
    takeaway_narr = _escape(plan.scenes[-1].narration_text)

    return f'''from manim import *
from manim_voiceover import VoiceoverScene


class ExplanationScene(VoiceoverScene):
    def construct(self):
        # SPEECH_SERVICE_PLACEHOLDER
        def curve(x):
            return 0.35 * x**2 + 0.4 * x + 0.8

        with self.voiceover(text="{intro}") as tracker:
            title = Text("{title}", font_size=38, color=BLUE_B).to_edge(UP, buff=0.7)
            subtitle = Text("{summary}", font_size=22, color=GREY_A)
            subtitle.next_to(title, DOWN, buff=0.8)
            if subtitle.width > config.frame_width - 1.5:
                subtitle.set(width=config.frame_width - 1.5)

            prompt = Text("How steep is the graph right here?", font_size=26, color=YELLOW)
            prompt.shift(DOWN * 1.2)
            focus_dot = Dot(prompt.get_bottom() + DOWN * 0.7, color=YELLOW)

            self.play(Write(title), run_time=tracker.duration * 0.25)
            self.play(FadeIn(subtitle), run_time=tracker.duration * 0.25)
            self.play(Write(prompt), FadeIn(focus_dot), run_time=tracker.duration * 0.25)
            self.wait(tracker.duration * 0.15)

        self.play(FadeOut(*self.mobjects))

        with self.voiceover(text="{secant_narr}") as tracker:
            axes = Axes(
                x_range=[-3, 3, 1],
                y_range=[0, 5, 1],
                x_length=7,
                y_length=4,
                axis_config={{"include_numbers": False}},
            ).shift(DOWN * 0.2)
            graph = axes.plot(curve, x_range=[-2.4, 2.1], color=BLUE_C)
            graph_label = Text("f(x)", font_size=20, color=BLUE_C).next_to(graph, UR, buff=0.2)

            x_a = -0.9
            x_b = 1.2
            point_a = Dot(axes.c2p(x_a, curve(x_a)), color=GREEN)
            point_b = Dot(axes.c2p(x_b, curve(x_b)), color=YELLOW)
            secant = Line(point_a.get_center(), point_b.get_center(), color=GREEN_B)
            rise = Line(point_a.get_center(), [point_b.get_x(), point_a.get_y(), 0], color=RED_C)
            run = Line([point_b.get_x(), point_a.get_y(), 0], point_b.get_center(), color=ORANGE)
            avg_label = Text("average change over an interval", font_size=20, color=GREEN_B)
            avg_label.to_edge(UP, buff=0.5)

            self.play(Create(axes), Create(graph), Write(graph_label), run_time=tracker.duration * 0.22)
            self.play(FadeIn(point_a), FadeIn(point_b), run_time=tracker.duration * 0.12)
            self.play(Create(secant), run_time=tracker.duration * 0.16)
            self.play(Create(rise), Create(run), Write(avg_label), run_time=tracker.duration * 0.18)
            self.wait(tracker.duration * 0.12)

        self.play(FadeOut(*self.mobjects))

        with self.voiceover(text="{tangent_narr}") as tracker:
            axes = Axes(
                x_range=[-3, 3, 1],
                y_range=[0, 5, 1],
                x_length=7,
                y_length=4,
                axis_config={{"include_numbers": False}},
            ).shift(DOWN * 0.2)
            graph = axes.plot(curve, x_range=[-2.4, 2.1], color=BLUE_C)

            x_center = 0.5
            left_x = 0.1
            right_x = 0.9
            point_left = Dot(axes.c2p(left_x, curve(left_x)), color=GREEN)
            point_right = Dot(axes.c2p(right_x, curve(right_x)), color=GREEN)
            secant = Line(point_left.get_center(), point_right.get_center(), color=GREEN_B)

            y_center = curve(x_center)
            slope = 0.7 * x_center + 0.4
            tangent = Line(
                axes.c2p(x_center - 1.0, y_center - slope * 1.0),
                axes.c2p(x_center + 1.0, y_center + slope * 1.0),
                color=YELLOW,
            )
            center_dot = Dot(axes.c2p(x_center, y_center), color=YELLOW)
            tangent_label = Text("instantaneous rate of change", font_size=20, color=YELLOW)
            tangent_label.to_edge(UP, buff=0.5)

            self.play(Create(axes), Create(graph), run_time=tracker.duration * 0.2)
            self.play(FadeIn(point_left), FadeIn(point_right), Create(secant), run_time=tracker.duration * 0.18)
            self.play(Transform(secant, tangent), FadeOut(point_left), FadeOut(point_right), FadeIn(center_dot), run_time=tracker.duration * 0.24)
            self.play(Write(tangent_label), run_time=tracker.duration * 0.14)
            self.wait(tracker.duration * 0.12)

        self.play(FadeOut(*self.mobjects))

        with self.voiceover(text="{takeaway_narr}") as tracker:
            takeaway_title = Text("Derivative = local steepness", font_size=30, color=YELLOW).to_edge(UP, buff=0.8)
            card = RoundedRectangle(width=9, height=2.6, corner_radius=0.2, color=BLUE_B, fill_opacity=0.08)
            body = Text("At one point on a curve, the derivative tells us the slope of the tangent line.", font_size=22, color=WHITE)
            if body.width > 8:
                body.set(width=8)
            body.move_to(card.get_center())

            self.play(Write(takeaway_title), Create(card), run_time=tracker.duration * 0.28)
            self.play(FadeIn(body), run_time=tracker.duration * 0.28)
            self.wait(tracker.duration * 0.18)

        self.wait()
'''


def generate_fallback_manim_code(plan: NarrationPlan) -> str:
    """Build a 3Blue1Brown-style Manim scene with on-screen explanations.

    Every scene shows:
    - Visual elements (shapes, graphs, diagrams) in the center
    - Explanatory labels alongside the visuals

    Uses only Text (no MathTex/LaTeX) so it works without a LaTeX installation.
    """
    topic = _identify_known_topic(
        " ".join(
            [
                plan.title,
                plan.concept_summary,
                *[scene.narration_text for scene in plan.scenes],
            ]
        )
    )
    if topic == "derivative":
        return _generate_derivative_fallback_code(plan)

    title = _escape(plan.title or "Math Concept")[:50]
    summary = _escape(plan.concept_summary or "")[:90]
    topic_text = " ".join(
        [
            plan.title,
            plan.concept_summary,
            *[scene.narration_text for scene in plan.scenes],
        ]
    )
    mode = _infer_visual_mode(topic_text)
    scenes = plan.scenes[:5]
    scene_count = len(scenes)

    scene_blocks = []
    for i, scene in enumerate(scenes):
        narr_full = _escape(scene.narration_text)
        vis_desc = _escape(scene.visual_description or "")[:60]

        if i == 0:
            # Scene 1: Visible question / hook
            scene_blocks.append(f'''
        # ── Scene {i + 1}: Visible Question ──
        with self.voiceover(text="{narr_full}") as tracker:
            heading = Text("{title}", font_size=28, color=BLUE_B, weight=BOLD).to_edge(UP, buff=0.6)
            question = Text("What should we notice here?", font_size=26, color=YELLOW)
            question.shift(UP * 1.2)

            left_box = RoundedRectangle(width=3.2, height=2.1, corner_radius=0.15, color=BLUE_B, fill_opacity=0.08).shift(LEFT * 2.4 + DOWN * 0.2)
            right_box = RoundedRectangle(width=3.2, height=2.1, corner_radius=0.15, color=GREEN_B, fill_opacity=0.08).shift(RIGHT * 2.4 + DOWN * 0.2)
            left_label = Text("same idea", font_size=18, color=BLUE_B).move_to(left_box.get_center() + UP * 0.45)
            right_label = Text("new angle", font_size=18, color=GREEN_B).move_to(right_box.get_center() + UP * 0.45)
            center_arrow = Arrow(left_box.get_right(), right_box.get_left(), buff=0.25, color=YELLOW)

            hook = Text("{_make_subtitle(scene.narration_text, 62)}", font_size=18, color=GREY_A)
            if hook.width > config.frame_width - 1.6:
                hook.set(width=config.frame_width - 1.6)
            hook.to_edge(DOWN, buff=0.9)

            self.play(Write(heading), run_time=tracker.duration * 0.14)
            self.play(Write(question), run_time=tracker.duration * 0.14)
            self.play(Create(left_box), Create(right_box), GrowArrow(center_arrow), run_time=tracker.duration * 0.24)
            self.play(FadeIn(left_label), FadeIn(right_label), FadeIn(hook), run_time=tracker.duration * 0.18)
            self.wait(tracker.duration * 0.14)

        self.play(FadeOut(*self.mobjects))''')

        elif i == 1 and mode == "graph":
            scene_blocks.append(f'''
        # ── Scene {i + 1}: Simplest Graph Case ──
        with self.voiceover(text="{narr_full}") as tracker:
            heading = Text("small concrete case", font_size=22, color=BLUE_C, weight=BOLD).to_edge(UP, buff=0.5)
            axes = Axes(x_range=[-3, 3, 1], y_range=[-1, 5, 1], x_length=5.7, y_length=3.8, axis_config={{"include_numbers": False}}).shift(DOWN * 0.2)
            graph = axes.plot(lambda x: 0.4 * x**2 + 0.5, x_range=[-2.4, 2.4], color=YELLOW)
            focus_x = 1.0
            focus_dot = Dot(axes.c2p(focus_x, 0.4 * focus_x**2 + 0.5), color=YELLOW)
            helper = DashedLine(axes.c2p(focus_x, 0), focus_dot.get_center(), color=GREY_B)
            note = Text("{_make_subtitle(scene.narration_text, 48)}", font_size=16, color=GREY_B)
            if note.width > 3.5:
                note.set(width=3.5)
            note.to_edge(RIGHT, buff=0.4).shift(DOWN * 0.3)

            self.play(Write(heading), run_time=tracker.duration * 0.12)
            self.play(Create(axes), Create(graph), run_time=tracker.duration * 0.28)
            self.play(FadeIn(focus_dot), Create(helper), run_time=tracker.duration * 0.16)
            self.play(FadeIn(note), run_time=tracker.duration * 0.16)
            self.wait(tracker.duration * 0.14)

        self.play(FadeOut(*self.mobjects))''')

        elif i == 1 and mode == "geometry":
            scene_blocks.append(f'''
        # ── Scene {i + 1}: Simplest Geometric Case ──
        with self.voiceover(text="{narr_full}") as tracker:
            heading = Text("small concrete case", font_size=22, color=BLUE_C, weight=BOLD).to_edge(UP, buff=0.5)
            triangle = Polygon(LEFT * 2 + DOWN, RIGHT * 0.4 + DOWN, RIGHT * 0.4 + UP * 1.4, color=BLUE_B)
            base_label = Text("known piece", font_size=18, color=BLUE_B).next_to(triangle, DOWN, buff=0.25)
            side = Line(RIGHT * 0.4 + DOWN, RIGHT * 0.4 + UP * 1.4, color=YELLOW)
            side_label = Text("changing part", font_size=18, color=YELLOW).next_to(side, RIGHT, buff=0.2)
            note = Text("{_make_subtitle(scene.narration_text, 48)}", font_size=16, color=GREY_B)
            if note.width > 3.5:
                note.set(width=3.5)
            note.to_edge(RIGHT, buff=0.4).shift(DOWN * 0.2)

            self.play(Write(heading), run_time=tracker.duration * 0.12)
            self.play(Create(triangle), run_time=tracker.duration * 0.22)
            self.play(Write(base_label), Create(side), Write(side_label), run_time=tracker.duration * 0.22)
            self.play(FadeIn(note), run_time=tracker.duration * 0.16)
            self.wait(tracker.duration * 0.14)

        self.play(FadeOut(*self.mobjects))''')

        elif i == 1:
            scene_blocks.append(f'''
        # ── Scene {i + 1}: Small Concrete Case ──
        with self.voiceover(text="{narr_full}") as tracker:
            heading = Text("small concrete case", font_size=22, color=BLUE_C, weight=BOLD).to_edge(UP, buff=0.5)
            left = RoundedRectangle(width=2.2, height=1.4, corner_radius=0.12, color=BLUE_B, fill_opacity=0.08).shift(LEFT * 2.0)
            middle = RoundedRectangle(width=2.2, height=1.4, corner_radius=0.12, color=GREEN_B, fill_opacity=0.08)
            right = RoundedRectangle(width=2.2, height=1.4, corner_radius=0.12, color=YELLOW, fill_opacity=0.08).shift(RIGHT * 2.0)
            a1 = Arrow(left.get_right(), middle.get_left(), buff=0.18, color=GREY_B)
            a2 = Arrow(middle.get_right(), right.get_left(), buff=0.18, color=GREY_B)
            note = Text("{_make_subtitle(scene.narration_text, 54)}", font_size=18, color=GREY_B)
            if note.width > config.frame_width - 2:
                note.set(width=config.frame_width - 2)
            note.to_edge(DOWN, buff=0.9)

            self.play(Write(heading), run_time=tracker.duration * 0.12)
            self.play(Create(left), Create(middle), Create(right), run_time=tracker.duration * 0.24)
            self.play(GrowArrow(a1), GrowArrow(a2), run_time=tracker.duration * 0.14)
            self.play(FadeIn(note), run_time=tracker.duration * 0.18)
            self.wait(tracker.duration * 0.14)

        self.play(FadeOut(*self.mobjects))''')

        elif i == 2:
            scene_blocks.append(f'''
        # ── Scene {i + 1}: Perspective Shift ──
        with self.voiceover(text="{narr_full}") as tracker:
            heading = Text("new point of view", font_size=22, color=BLUE_C, weight=BOLD).to_edge(UP, buff=0.5)
            left_frame = RoundedRectangle(width=3.0, height=2.2, corner_radius=0.12, color=BLUE_B, fill_opacity=0.05).shift(LEFT * 2.4)
            right_frame = RoundedRectangle(width=3.0, height=2.2, corner_radius=0.12, color=YELLOW, fill_opacity=0.07).shift(RIGHT * 2.4)
            before = Text("before", font_size=18, color=BLUE_B).move_to(left_frame.get_center() + UP * 0.7)
            after = Text("after", font_size=18, color=YELLOW).move_to(right_frame.get_center() + UP * 0.7)
            bridge = Arrow(left_frame.get_right(), right_frame.get_left(), buff=0.25, color=YELLOW)
            note = Text("{_make_subtitle(scene.narration_text, 52)}", font_size=18, color=GREY_A)
            if note.width > config.frame_width - 1.8:
                note.set(width=config.frame_width - 1.8)
            note.to_edge(DOWN, buff=0.8)

            self.play(Write(heading), run_time=tracker.duration * 0.1)
            self.play(Create(left_frame), Create(right_frame), run_time=tracker.duration * 0.2)
            self.play(FadeIn(before), FadeIn(after), GrowArrow(bridge), run_time=tracker.duration * 0.18)
            self.play(FadeIn(note), run_time=tracker.duration * 0.18)
            self.wait(tracker.duration * 0.14)

        self.play(FadeOut(*self.mobjects))''')

        elif i == scene_count - 2:
            scene_blocks.append(f'''
        # ── Scene {i + 1}: Common Mistake ──
        with self.voiceover(text="{narr_full}") as tracker:
            heading = Text("tempting but wrong", font_size=22, color=RED_C, weight=BOLD).to_edge(UP, buff=0.5)
            wrong_box = RoundedRectangle(width=3.2, height=2.0, corner_radius=0.12, color=RED_C, fill_opacity=0.06).shift(LEFT * 2.1)
            right_box = RoundedRectangle(width=3.2, height=2.0, corner_radius=0.12, color=GREEN_B, fill_opacity=0.06).shift(RIGHT * 2.1)
            wrong_label = Text("first guess", font_size=18, color=RED_C).move_to(wrong_box.get_center() + UP * 0.55)
            right_label = Text("better view", font_size=18, color=GREEN_B).move_to(right_box.get_center() + UP * 0.55)
            divider = Line(UP * 1.1, DOWN * 1.4, color=GREY_B)
            note = Text("{_make_subtitle(scene.narration_text, 56)}", font_size=17, color=GREY_A)
            if note.width > config.frame_width - 1.8:
                note.set(width=config.frame_width - 1.8)
            note.to_edge(DOWN, buff=0.8)

            self.play(Write(heading), run_time=tracker.duration * 0.1)
            self.play(Create(wrong_box), Create(right_box), Create(divider), run_time=tracker.duration * 0.22)
            self.play(FadeIn(wrong_label), FadeIn(right_label), run_time=tracker.duration * 0.16)
            self.play(FadeIn(note), run_time=tracker.duration * 0.18)
            self.wait(tracker.duration * 0.14)

        self.play(FadeOut(*self.mobjects))''')

        else:
            scene_blocks.append(f'''
        # ── Scene {i + 1}: Takeaway ──
        with self.voiceover(text="{narr_full}") as tracker:
            takeaway_label = Text("key insight", font_size=20, color=YELLOW, weight=BOLD).to_edge(UP, buff=0.8)
            result_box = RoundedRectangle(corner_radius=0.15, width=9, height=2.5, color=YELLOW, fill_opacity=0.06, stroke_width=1.5)
            takeaway_text = Text("{_make_subtitle(scene.narration_text, 88)}", font_size=22, color=WHITE)
            if takeaway_text.width > 8:
                takeaway_text.set(width=8)
            takeaway_text.move_to(result_box.get_center())
            self.play(Write(takeaway_label), run_time=tracker.duration * 0.14)
            self.play(Create(result_box), run_time=tracker.duration * 0.18)
            self.play(Write(takeaway_text), run_time=tracker.duration * 0.28)
            self.wait(tracker.duration * 0.16)

        self.play(FadeOut(*self.mobjects))''')

    scenes_code = "\n".join(scene_blocks)

    return f"""from manim import *
from manim_voiceover import VoiceoverScene


class ExplanationScene(VoiceoverScene):
    def construct(self):
        # SPEECH_SERVICE_PLACEHOLDER
{scenes_code}

        self.wait()
"""

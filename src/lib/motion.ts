/**
 * Motion Utilities Library
 * 
 * Provides spring physics, easing functions, gesture detection,
 * and animation orchestration for OS-like experiences.
 * 
 * @module lib/motion
 */

// === SPRING PHYSICS ===

/**
 * Spring configuration for physics-based animations.
 * Higher tension = faster movement, higher friction = less overshoot.
 */
export interface SpringConfig {
    tension: number;
    friction: number;
    mass?: number;
}

/**
 * Pre-configured spring presets for common use cases.
 */
export const SPRING_PRESETS: Record<string, SpringConfig> = {
    default: { tension: 170, friction: 26 },
    gentle: { tension: 120, friction: 14 },
    wobbly: { tension: 180, friction: 12 },
    stiff: { tension: 210, friction: 20 },
    slow: { tension: 280, friction: 60 },
    molasses: { tension: 280, friction: 120 }
};

/**
 * Calculate spring animation acceleration.
 * @param from - Current value
 * @param to - Target value
 * @param velocity - Current velocity
 * @param config - Spring configuration
 * @returns Acceleration to apply
 */
export function springAnimation(
    from: number,
    to: number,
    velocity: number,
    config?: SpringConfig
): number {
    const cfg = config ?? SPRING_PRESETS.default;
    const tension = cfg!.tension;
    const friction = cfg!.friction;
    const mass = cfg!.mass ?? 1;

    const springForce = -tension * (from - to);
    const dampingForce = -friction * velocity;
    const acceleration = (springForce + dampingForce) / mass;

    return acceleration;
}

// === EASING FUNCTIONS ===

/**
 * Easing function type - maps normalized time (0-1) to progress (0-1).
 */
export type EasingFunction = (t: number) => number;

/**
 * Collection of easing functions for animations.
 */
export const EASING: Record<string, EasingFunction> = {
    linear: (t) => t,

    // Cubic
    easeInCubic: (t) => t * t * t,
    easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
    easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

    // Expo
    easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
    easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),

    // Back (overshoot)
    easeOutBack: (t) => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },

    // Bounce
    easeOutBounce: (t) => {
        const n1 = 7.5625;
        const d1 = 2.75;

        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    }
};

// === ANIMATION ORCHESTRATION ===

/**
 * Linear interpolation between two values.
 * @param start - Start value
 * @param end - End value
 * @param t - Progress (0-1)
 * @returns Interpolated value
 */
export function lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
}

/**
 * Animate a value over time using requestAnimationFrame.
 * @param from - Start value
 * @param to - End value
 * @param duration - Duration in milliseconds
 * @param easing - Easing function (defaults to easeOutExpo)
 * @param onUpdate - Callback with current value
 * @param onComplete - Called when animation finishes
 * @returns Cleanup function to cancel animation
 */
export function animate(
    from: number,
    to: number,
    duration: number,
    easing?: EasingFunction,
    onUpdate?: (value: number) => void,
    onComplete?: () => void
): () => void {
    const easingFn = easing ?? EASING.easeOutExpo;
    const startTime = performance.now();
    let rafId: number;

    const loop = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easingFn!(progress);
        const currentValue = lerp(from, to, easedProgress);

        onUpdate?.(currentValue);

        if (progress < 1) {
            rafId = requestAnimationFrame(loop);
        } else {
            onComplete?.();
        }
    };

    rafId = requestAnimationFrame(loop);

    // Return cleanup function
    return () => cancelAnimationFrame(rafId);
}

// === GESTURE DETECTION ===

/**
 * Gesture state for tracking touch/mouse interactions.
 */
export interface GestureState {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    deltaX: number;
    deltaY: number;
    velocityX: number;
    velocityY: number;
    duration: number;
}

export type GestureCallback = (state: GestureState) => void;

/**
 * Detect swipe gestures on an element.
 * @param element - DOM element to detect gestures on
 * @param onSwipe - Callback when swipe is detected
 * @param threshold - Minimum distance to trigger swipe (default: 50px)
 * @returns Cleanup function to remove listeners
 */
export function detectSwipe(
    element: HTMLElement,
    onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void,
    threshold: number = 50
): () => void {
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const handleStart = (e: TouchEvent | MouseEvent) => {
        const point = 'touches' in e ? e.touches[0] : e;
        if (!point) return;
        startX = point.clientX;
        startY = point.clientY;
        startTime = Date.now();
    };

    const handleEnd = (e: TouchEvent | MouseEvent) => {
        const point = 'changedTouches' in e ? e.changedTouches[0] : e;
        if (!point) return;
        const deltaX = point.clientX - startX;
        const deltaY = point.clientY - startY;
        const duration = Date.now() - startTime;

        // Ignore very quick taps
        if (duration < 50) return;

        // Determine direction
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (Math.abs(deltaX) > threshold) {
                onSwipe(deltaX > 0 ? 'right' : 'left');
            }
        } else {
            // Vertical swipe
            if (Math.abs(deltaY) > threshold) {
                onSwipe(deltaY > 0 ? 'down' : 'up');
            }
        }
    };

    element.addEventListener('touchstart', handleStart as EventListener);
    element.addEventListener('touchend', handleEnd as EventListener);
    element.addEventListener('mousedown', handleStart as EventListener);
    element.addEventListener('mouseup', handleEnd as EventListener);

    return () => {
        element.removeEventListener('touchstart', handleStart as EventListener);
        element.removeEventListener('touchend', handleEnd as EventListener);
        element.removeEventListener('mousedown', handleStart as EventListener);
        element.removeEventListener('mouseup', handleEnd as EventListener);
    };
}

/**
 * Create ripple effect at click position.
 * @param event - Mouse event with click coordinates
 * @param container - Container element for ripple
 */
export function createRipple(
    event: { clientX: number; clientY: number },
    container: HTMLElement
): void {
    const ripple = document.createElement('span');
    const rect = container.getBoundingClientRect();

    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.className = 'ripple-effect';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    container.appendChild(ripple);

    // Remove after animation
    setTimeout(() => ripple.remove(), 600);
}

/**
 * Check if user prefers reduced motion.
 * @returns true if user has enabled reduced motion in OS settings
 */
export function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation duration based on user preference.
 * Returns 1ms if reduced motion is enabled.
 * @param baseDuration - Normal duration in milliseconds
 * @returns Adjusted duration
 */
export function getAnimationDuration(baseDuration: number): number {
    return prefersReducedMotion() ? 1 : baseDuration;
}

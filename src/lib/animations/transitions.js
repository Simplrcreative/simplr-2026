import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const COFFEE = '#300F1D'
const LIGHT = '#FFFFFF'

const TRANSITION_FAMILIES = ['coffee-to-light', 'light-to-coffee']
const INCOMING_TRIGGER_START = 'top 50%'
const INCOMING_TRIGGER_END = 'top 5%'
const OUTGOING_TRIGGER_START = 'top 50%'
const OUTGOING_TRIGGER_END = 'top 5%'

let pluginsRegistered = false

function registerPlugins() {
	if (!pluginsRegistered) {
		gsap.registerPlugin(ScrollTrigger)
		pluginsRegistered = true
	}
}

function getTransitionFamily(target) {
	return TRANSITION_FAMILIES.find((family) => target.classList.contains(`${family}-incoming`) || target.classList.contains(`${family}-outgoing`))
}

function getTransitionColors(family) {
	return family === 'coffee-to-light'
		? { fromColor: COFFEE, toColor: LIGHT }
		: { fromColor: LIGHT, toColor: COFFEE }
}

function getTransitionTiming(target, variant) {
	const defaults = variant === 'OUTGOING'
		? { start: OUTGOING_TRIGGER_START, end: OUTGOING_TRIGGER_END }
		: { start: INCOMING_TRIGGER_START, end: INCOMING_TRIGGER_END }

	const variantPrefix = variant === 'OUTGOING' ? 'transitionOutgoing' : 'transitionIncoming'

	return {
		start: target.dataset[`${variantPrefix}Start`] || target.dataset.transitionStart || defaults.start,
		end: target.dataset[`${variantPrefix}End`] || target.dataset.transitionEnd || defaults.end,
	}
}

export function createSurfaceColorTransitions(scope) {
	if (!scope) {
		return () => undefined
	}

	registerPlugins()

	const incomingTargets = Array.from(scope.querySelectorAll('.coffee-to-light-incoming, .light-to-coffee-incoming'))
	const outgoingTargets = Array.from(scope.querySelectorAll('.coffee-to-light-outgoing, .light-to-coffee-outgoing'))
	const allTargets = [...incomingTargets, ...outgoingTargets]

	if (!allTargets.length) {
		return () => undefined
	}

	const media = gsap.matchMedia()

	media.add('(prefers-reduced-motion: no-preference)', () => {
		const animations = incomingTargets.flatMap((incomingTarget) => {
			const family = getTransitionFamily(incomingTarget)
			if (!family) {
				return []
			}

			const familyTargets = [
				incomingTarget,
				...outgoingTargets.filter((target) => getTransitionFamily(target) === family),
			]
			const { fromColor, toColor } = getTransitionColors(family)

			familyTargets.forEach((target) => {
				gsap.set(target, { backgroundColor: fromColor })
			})

			return familyTargets.map((target) => {
				const variant = target === incomingTarget ? 'INCOMING' : 'OUTGOING'
				const { start, end } = getTransitionTiming(target, variant)

				return gsap.fromTo(
					target,
					{ backgroundColor: fromColor },
					{
						backgroundColor: toColor,
						ease: 'none',
						scrollTrigger: {
							trigger: incomingTarget,
							start,
							end,
							scrub: true,
							invalidateOnRefresh: true,
							refreshPriority: -20,
						},
					},
				)
			})
		})

		return () => {
			animations.forEach((animation) => {
				animation.scrollTrigger?.kill()
				animation.kill()
			})
		}
	})

	media.add('(prefers-reduced-motion: reduce)', () => {
		allTargets.forEach((target) => {
			const family = getTransitionFamily(target)
			if (!family) {
				return
			}

			const { toColor } = getTransitionColors(family)
			gsap.set(target, {
				backgroundColor: toColor,
			})
		})

		return undefined
	})

	return () => {
		media.revert()
	}
}
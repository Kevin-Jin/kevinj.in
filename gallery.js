$(document).ready(function() {
	$.fn.extend({
		bgLoaded: function (callback, timeout) {
			var $img = $('<img/>').attr('src', $(this).css('background-image').replace(/^url\(\s*(['"]?)(.*?)\1\s*\)$/, '$2')), timeoutTask = null;

			var eventHandler = function() {
				$img.off('load error', eventHandler).remove();
				if (timeoutTask != null)
					clearTimeout(timeoutTask);
				callback();
			}

			if (timeout)
				timeoutTask = setTimeout(eventHandler, timeout);
			$img.one('load error', eventHandler);
		}
	});

	if (!sameDomain) {
		var $sunglasses = $('.sunglasses'), $topbun = $('.topbun'), $headline = $('.headline'), $subtitle = $('.subtitle'), $otherBacon = $('.mugshot,.quicklinks,.inspirational');
		if (canUse3dTransforms)
			$sunglasses.addClass('hwaccel');

		$sunglasses.css('opacity', '1');
		$('.toppings').bgLoaded(function() {
			$sunglasses.transition('opacity 1s').css('opacity', '');
		}, 2000);
	}

	initializeAnimationImplementations('.preview');
	disableHorizontalScrollAction();
	disableReflowOnResize();
	enhanceJump();
});

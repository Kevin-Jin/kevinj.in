function enableScaleMobile() {
	var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	var maxS = w / $('.bacon').outerWidth();
	$('meta[name=viewport]').attr('content', 'width=device-width, user-scalable=yes, maximum-scale=' + maxS);
}

function getOrientation() {
	var orientation;

	if (window.orientation === undefined) {
		// No JavaScript orientation support. Work it out.
		if (document.documentElement.clientWidth > document.documentElement.clientHeight)
			orientation = 'landscape';
		else
			orientation = 'portrait';
	} else if (window.orientation === 0 || window.orientation === 180) {
		orientation = 'portrait';
	} else {
		orientation = 'landscape';
	}

	return orientation;
}

function getViewportScale() {
	// Get viewport width
	var viewportWidth = document.documentElement.clientWidth;

	// Abort. Screen width is greater than the viewport width (not fullscreen).
	if (screen.width > viewportWidth) {
		//console.log('Aborted viewport scale measurement. Screen width > viewport width');
		return;
	}

	// Get the orientation corrected screen width
	var orientation = getOrientation();
	var screenWidth = screen.width;

	if (orientation === 'portrait') {
		// Take smaller of the two dimensions
		if (screen.width > screen.height)
			screenWidth = screen.height;
	} else {
		// Take larger of the two dimensions
		if (screen.width < screen.height)
			screenWidth = screen.height;
	}

	// Calculate viewport scale
	return screenWidth / window.innerWidth;
}

function initialScrollMobile() {
	var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	var s = getViewportScale();
	w /= s;
	h /= s;

	if (!w || !h || w > 639 || h > 532)
		return;

	if (!location.hash) {
		setTimeout(function () {
			if (!pageYOffset) {
				var offset = $('.bacon').offset();
				window.scrollTo(offset.left, offset.top);
			}
		}, 1000);
	}
}

function initialAnimation(onComplete) {
	var style = document.documentElement.style;
	if (sameDomain || typeof (style.webkitTransition) === "undefined"
			&& typeof (style.MozTransition) === "undefined"
			&& typeof (style.OTransition ) === "undefined"
			&& typeof (style.MsTransition ) === "undefined"
			&& typeof (style.transition ) === "undefined"
	) {
		onComplete();
		return;
	}

	var $sunglasses = $('.sunglasses'), $topbun = $('.topbun'), $headline = $('.headline'), $subtitle = $('.subtitle'), $otherBacon = $('.mugshot,.quicklinks,.inspirational');
	if (canUse3dTransforms) {
		$sunglasses.addClass('hwaccel');
		//$topbun.addClass('hwaccel');
		$headline.addClass('hwaccel');
		$subtitle.addClass('hwaccel');
		$otherBacon.addClass('hwaccel');
	}

	$sunglasses.css('opacity', '1');
	$topbun.css('opacity', '0');
	$headline.css('opacity', '0');
	$subtitle.css('opacity', '0');
	$otherBacon.css('opacity', '0');
	$('.toppings').bgLoaded(function() {
		$sunglasses.transition('opacity 1s').css('opacity', '');
		setTimeout(function() {
			$topbun.translate(0, -100).show().transition('opacity 1s, transform 1s').css('opacity' ,'').transform('');
			$headline.translate(100, 0).show().transition('opacity 1s, transform 1s').css('opacity' ,'').transform('');
			$subtitle.translate(-100, 0).show().transition('opacity 1s, transform 1s').css('opacity' ,'').transform('');
			$otherBacon.translate(0, 100).show().transition('opacity 1s, transform 1s').css('opacity' ,'').transform('');
			onComplete();
		}, 400);
	}, 2000);
}

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

	enableScaleMobile();
	initialAnimation(initialScrollMobile);
});

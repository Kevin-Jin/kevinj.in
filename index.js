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

function appendTo(prefix, value) {
	if (prefix === '')
		return value;
	else
		return prefix + ', ' + value;
}

// Inspired by the R function paste(), without any recycling functionality.
// The collapse functionality can be accomplished with Array.join().
function paste() {
	if (!Array.isArray) {
		Array.isArray = function(arg) {
			return Object.prototype.toString.call(arg) === '[object Array]';
		};
	}

	var simplify = function(array) {
		if (array.length == 1)
			return array[0];
		else
			return array;
	}

	var concated = [ ];
	if (arguments.length === 1 && Array.isArray(arguments[i]))
		arguments = arguments[0];
	var sep = arguments[0];
	for (var i = 1; i < arguments.length; i++) {
		if (Array.isArray(arguments[i])) {
			for (var j = 0; j < arguments[i].length; j++)
				concated[j] = (concated[j] ? concated[j] + sep : '') + arguments[i][j];
		} else {
			concated[0] = (concated[0] ? concated[0] + sep : '') + arguments[i];
		}
	}
	return concated;
}

function robustSplit(str, split) {
	var allZero = function(obj) {
		for (var key in obj)
			if (obj.hasOwnProperty(key) && obj[key] != 0)
				return false;
		return true;
	}

	if (typeof String.prototype.trim !== 'function') {
		String.prototype.trim = function() {
			return this.replace(/^\s+|\s+$/g, ''); 
		};
	}

	if (split.length != 1 || split == '\\' || split == '\"' || split == '\''
			|| split == '(' || split == '[' || split == '{'
			|| split == ')' || split == ']' || split == '}')
		throw 'invalid split string';

	var open = { };
	var start = 0;
	var result = [ ];
	for (var i = 0; i < str.length; i++) {
		switch (str[i]) {
			case '\\':
				if (open['\''] == 1 || open['\"'] == 1)
					i++;
				break;
			case '(':
				if (!open['\''] && !open['\"'])
					open[')'] = (open[')'] || 0) + 1;
				break;
			case '[':
				if (!open['\''] && !open['\"'])
					open[']'] = (open[']'] || 0) + 1;
				break;
			case '{':
				if (!open['\''] && !open['\"'])
					open['}'] = (open['}'] || 0) + 1;
				break;
			case ')':
			case ']':
			case '}':
				if (!open['\''] && !open['\"'])
					open[str[i]]--;
				break;
			case '\"':
				if (!open['\''])
					open[str[i]] = !open[str[i]] ? 1 : 0;
				break;
			case '\'':
				if (!open['\"'])
					open[str[i]] = !open[str[i]] ? 1 : 0;
				break;
			default:
				if (str[i] == split && allZero(open)) {
					result.push(str.substring(start, i).trim());
					start = i + 1;
				}
				break;
		}
	}
	result.push(str.substring(start, str.length).trim());
	return result;
}

function getTransition($selector) {
	return paste(' ', robustSplit($selector.css('transition-property'), ','), robustSplit($selector.css('transition-duration'), ','), robustSplit($selector.css('transition-timing-function'), ','), robustSplit($selector.css('transition-delay'), ',')).join(',');
}

function initialAnimation(onComplete) {
	var style = document.documentElement.style;
	if (typeof (sameDomain) !== 'undefined' && sameDomain
			|| typeof (style.webkitTransition) === "undefined"
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
			$topbun.translate(0, -100).show().transition(appendTo(getTransition($topbun), 'opacity 1s, transform 1s')).css('opacity', '').transform('');
			$headline.translate(100, 0).show().transition(appendTo(getTransition($headline), 'opacity 1s, transform 1s')).css('opacity', '').transform('');
			$subtitle.translate(-100, 0).show().transition(appendTo(getTransition($subtitle), 'opacity 1s, transform 1s')).css('opacity', '').transform('');
			$otherBacon.translate(0, 100).show().transition(appendTo(getTransition($otherBacon), 'opacity 1s, transform 1s')).css('opacity', '').transform('');
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

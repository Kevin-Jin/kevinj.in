//these functions must be implemented before being used!
var getCurrentLeft, translateImmediately, translateOverTime, skipTransition;

function setUpDomMatrix() {
	if (window.DOMMatrix) {
		return;
	} else if (window.MSCSSMatrix) {
		window.DOMMatrix = window.MSCSSMatrix;
	} else if (window.WebKitCSSMatrix) {
		window.DOMMatrix = window.WebKitCSSMatrix;
	} else {
		window.DOMMatrix = function(str) {
			// e.g.: "-.12e-34px ,  5.2,+1"
			var paramMatchLast = '[+-]?\\d*\\.?\\d+(?:e[+-]?\\d+)?[a-zA-Z]*\\s*', paramMatchMidd;
			paramMatchMidd = '(?:' + paramMatchLast + ',\\s*)*';
			paramMatchLast = '(?:' + paramMatchLast + ')';
			var match = new RegExp('^\\s*(matrix(?:3d)?)\\s*\\((' + paramMatchMidd + paramMatchLast + ')\\)\\s*$').exec(str);
			var errorMsg = 'Failed to construct \'DOMMatrix\': Failed to parse \'' + str + '\''
			if (!match)
				throw errorMsg;

			for (var i = 1; i <= 4; i++)
				for (var j = 1; j <= 4; j++)
					this['m' + i + j] = (i == j) ? 1 : 0; // kronecker delta
			var cssFunc = match[1];
			var args = match[2].split(/\s*,\s*/);
			if (cssFunc.toLowerCase() == 'matrix3d') {
				if (args.length != 16)
					throw errorMsg;
				for (var i = 0; i < 16; i = (i == 11) ? 15 : i + 1) {
					if (isNaN(args[i]))
						throw errorMsg;
					this['m' + Math.floor(i / 4 + 1) + (i % 4 + 1)] = parseFloat(args[i]);
				}
				for (var i = 12; i < 15; i++) {
					if (isNaN(args[i]) && /[a-zA-Z]+$/.exec(args[i])[0].toLowerCase() != "px")
						throw 'Length unit not supported';
					this['m' + Math.floor(i / 4 + 1) + (i % 4 + 1)] = parseFloat(args[i]);
				}
			} else if (cssFunc.toLowerCase() == 'matrix') {
				if (args.length != 6)
					throw errorMsg;
				for (var i = 0; i < 4; i++) {
					if (isNaN(args[i]))
						throw errorMsg;
					this['m' + Math.floor(i / 2 + 1) + (i % 2 + 1)] = parseFloat(args[i]);
				}
				for (var i = 4; i < 6; i++) {
					if (isNaN(args[i]) && /[a-zA-Z]+$/.exec(args[i])[0].toLowerCase() != "px")
						throw 'Length unit not supported';
					this['m4' + (i % 4 + 1)] = parseFloat(args[i]);
				}
			}
		}
	}
}

function initializeAnimationImplementations(selector) {
	//IE 9 dies here for some reason. Just make it use the lowest common denominator implementations
	$selector = $(selector);
	if (typeof window.Modernizr === 'undefined') {
		window.Modernizr = new Object();
		window.Modernizr.csstransitions = false;
		window.Modernizr.csstransforms = false;
		window.Modernizr.csstransforms3d = false;
	}
	window.Modernizr.cssprefixed = function(str) {  
		return this.prefixed(str).replace(/([A-Z])/g, function(str, m1) {
			return '-' + m1.toLowerCase();
		}).replace(/^vp-/,'-vp-');
	};

	// TODO: accelerated implementations still have problem with Android Chrome
	// using CSS rule rather than mid-transition rendered value that getComputedStyle()
	// should return. 
	if (window.Modernizr.csstransitions && window.Modernizr.csstransforms3d) {
		setUpDomMatrix();
		transitionProp = window.Modernizr.cssprefixed('transition');
		transformProp = window.Modernizr.cssprefixed('transform');

		$selector = $selector.children();
		$selector.css(transformProp, 'translate3d(0,0,0)');

		getCurrentLeft = function() {
			return new DOMMatrix($selector.css(transformProp)).m41;
		};

		translateImmediately = function(newLeft) {
			$selector.css(transitionProp, '').css(transformProp, 'translate3d(' + (getCurrentLeft() - newLeft) + 'px,0,0)');
		};

		translateOverTime = function(newLeft, milliseconds) {
			$selector.css(transitionProp, transformProp + ' ' + milliseconds / 1000 + 's linear').css(transformProp, 'translate3d(' + (getCurrentLeft() - newLeft) + 'px,0,0)');
		};

		skipTransition = function() {
			$selector.css(transitionProp, '')
		};
	} else if (window.Modernizr.csstransitions && window.Modernizr.csstransforms) {
		setUpDomMatrix();
		transitionProp = window.Modernizr.cssprefixed('transition');
		transformProp = window.Modernizr.cssprefixed('transform');

		$selector = $selector.children();
		$selector.css(transformProp, 'translate(0,0)');

		getCurrentLeft = function() {
			return new DOMMatrix($selector.css(transformProp)).m41;
		};

		translateImmediately = function(newLeft) {
			$selector.css(transitionProp, '').css(transformProp, 'translate(' + (getCurrentLeft() - newLeft) + 'px,0)');
		};

		translateOverTime = function(newLeft, milliseconds) {
			$selector.css(transitionProp, transformProp + ' ' + milliseconds / 1000 + 's linear').css(transformProp, 'translate(' + (getCurrentLeft() - newLeft) + 'px,0)');
		};

		skipTransition = function() {
			$selector.css(transitionProp, '')
		};
	} else {
		movingTo = $selector.scrollLeft();

		getCurrentLeft = function() {
			return $selector.scrollLeft();
		};

		translateImmediately = function(newLeft) {
			movingTo = getCurrentLeft() + newLeft;
			$selector.scrollLeft(movingTo);
		};

		translateOverTime = function(newLeft, milliseconds) {
			if (movingTo != getCurrentLeft() + newLeft) {
				movingTo = getCurrentLeft() + newLeft;
				$selector.stop().animate({
					scrollLeft: movingTo
				}, {
					duration: milliseconds,
					easing: "linear",
					queue: false
				});
			}
		};

		skipTransition = function() {
			$selector.stop();
		};
	}
}

function disableHorizontalScrollAction() {
	$('.thumbnails').on('scroll', function(e) {
		$target = $(e.target);
		scrollPos = $target.scrollLeft();
		if (scrollPos == 0)
			$target.removeClass('nosidebar');
		else
			$target.addClass('nosidebar');
	}).trigger('scroll');
}

function isMobile() {
	return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
}

function isAddressBarVisilityChanged() {
	var $window = $(window);
	try {
		return ($window.data('lastInnerHeight') && $window.data('lastWidth')
				&& $window.data('lastInnerHeight') != window.innerHeight
				&& $window.width() == $window.data('lastWidth'));
	} finally {
		$window.data('lastInnerHeight', window.innerHeight);
		$window.data('lastWidth', $window.width());
	}
}

function disableReflowOnResize() {
	$('.preview').data('slideId', location.hash);

	// mobile browsers resize the window when address bar is hidden after
	// scrolling. prevent .immersive from resizing when this happens.
	$('body').wrapInner('<div id="wrapper"></div>');
	$window = $(window);
	$('html, body, #wrapper').css({ height: $window.height() });
	$window.on('resize', function(e) {
		if (!isMobile() || !isAddressBarVisilityChanged())
			$('html, body, #wrapper').css({ height: $window.height() });

		// reflow the images
		setTimeout(function() {
			$toReflow = $('.thumbnails, .preview');
			var originalDisplay = $toReflow.css('display');
			$toReflow.css('display', 'none');
			$toReflow.prop('offsetHeight');
			$toReflow.css('display', originalDisplay);
		}, 0);

		// jump to correct slide on page load, or fix positioning issue after slides changed size
		$preview = $('.preview');
		$slide = $($('.preview').data('slideId'));
		if ($preview.has($slide).length > 0) {
			skipTransition();
			translateImmediately($slide.position().left);
		}
	}).trigger('resize');
}

function enhanceJump() {
	$page = $('html, body');
	$preview = $('.preview');
	$('.thumbnails a').click(function(){
		oldSlideId = $('.preview').data('slideId');
		$('.preview').data('slideId', newSlideId = $.attr(this, 'href'));
		$slide = $(newSlideId);

		$page.on("scroll mousedown wheel DOMMouseScroll mousewheel keyup touchmove", function(){
			$page.stop();
		});
		$page.stop().animate({
			scrollTop: $slide.offset().top
		}, 300, "swing", function() {
			$page.off("scroll mousedown wheel DOMMouseScroll mousewheel keyup touchmove");
		});
		//Chrome for Android has problems with clicking the same link while animation is still running
		if (oldSlideId != newSlideId)
			translateOverTime($slide.position().left, 300);
		return false;
	});
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

	if (typeof (sameDomain) === 'undefined' || !sameDomain) {
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

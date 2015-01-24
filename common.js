var canUse3dTransforms = false;

function initializeJqueryExtensions() {
	canUse3dTransforms = (function() {
		if (!window.getComputedStyle)
			return false;

		var el = document.createElement('p'), has3d, transforms = {
			'webkitTransform':'-webkit-transform',
			'OTransform':'-o-transform',
			'msTransform':'-ms-transform',
			'MozTransform':'-moz-transform',
			'transform':'transform'
		};

		// Add it to the body to get the computed style.
		document.body.insertBefore(el, null);

		for (var t in transforms) {
			if (el.style[t] === undefined)
				continue;

			el.style[t] = "translate3d(1px,1px,1px)";
			has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
		}

		document.body.removeChild(el);

		return (has3d !== undefined && has3d.length > 0 && has3d !== "none");
	})();

	$.fn.extend({
		transition: function (value) { return $(this).css('-webkit-transition', value).css('transition', value); },
		transform: function (value) { return $(this).css('-webkit-transform', value).css('-ms-transform', value).css('transform', value); },
		translate: canUse3dTransforms ? function(x, y) { return $(this).transform('translate3d(' + x + 'px,' + y + 'px,0)'); } : function(x, y) { return $(this).transform('translate(' + x + 'px,' + y + 'px)'); }
	});
}

function deobfuscateEmail() {
	//decoded from rot13
	var address = 'xriva@xrivaw.va'.replace(/[a-zA-Z]/g, function(c){return String.fromCharCode((c<='Z'?90:122)>=(c=c.charCodeAt(0)+13)?c:c-26);});
	$('.email').attr('href', 'mailto:' + address).each(function() {
		if ($(this).find('.show').length != 0)
			$(this).text(address);
	});
}

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

function enhanceSidebar() {
	//disable scrolling when sidebar is open
	//TODO: show scrollbar even with overflow: hidden
	$('#sidesordered').on('change', function(){
		if ($(this).prop('checked'))
			$('body').css('overflow', 'hidden');
		else
			$('body').css('overflow', '');
	});



	//enable dragging the sidebar
	//TODO: "[-webkit-]filter: opacity(%)" seems to perform much better than rgba
	//TODO: use left and rgba instead of translate and opacity in CSS to maximize compatibility,
	//then determine hardware accelerated transition capabilities in JavaScript to maximize perf.
	var initialPageX = null, finalPageX = null, initialT, finalT, finalPageY, currentTranslateX, sidebarTeaser = null, isScroll = -1, HOT_EDGE_WIDTH = 16;

	//helper functions
	var getCoordinates = function(e) {
		var pageX, pageY;
		if (e.originalEvent && e.originalEvent.touches && e.originalEvent.touches.length > 0) {
			pageX = e.originalEvent.touches[0].pageX;
			pageY = e.originalEvent.touches[0].pageY;
		} else {
			pageX = e.pageX;
			pageY = e.pageY;
		}
		return { x: pageX, y: pageY };
	};
	var isSidebarOpen = function() { return $('#sidesordered').prop('checked'); };
	var isDragging = function() { return (finalPageX != null); };
	var hasBeenMoved = function() { return (initialPageX != null); };
	var isDraggingSidebar = function(pointer, secondaryCondition) {
		if (isScroll == 1 || isScroll == -1 && Math.abs(finalPageY - pointer.y) > Math.abs(finalPageX - pointer.x) && secondaryCondition) {
			isScroll = 1;
			return false;
		} else {
			isScroll = 0;
			return true;
		}
	};
	var preventSidebarTeaser = function() {
		if (sidebarTeaser != null) {
			clearTimeout(sidebarTeaser);
			sidebarTeaser = null;
		}
	};

	//cache frequently used values
	var $blinds = $('.blinds');
	var $sidebar = $('#sidesordered~.boxedin');
	var sidebarWidth;
	$(window).on('resize', function(e) {
		if ($('.ordersides').css('display') == 'none')
			sidebarWidth = null;
		else
			sidebarWidth = $sidebar.width();
	}).trigger('resize'); //call resize on page load

	if (canUse3dTransforms) {
		$sidebar.addClass('hwaccel');
		$blinds.addClass('hwaccel');
	}

	//main logic
	$(document).on('touchstart mousedown', function(e) {
		var pointer = getCoordinates(e);

		//correction for hasBeenMoved()
		initialPageX = null;

		//correction for isDraggingSidebar()
		isScroll = -1;

		//check for validity of dragging sidebar
		var isClosing = isSidebarOpen();
		if (pointer.x > HOT_EDGE_WIDTH && !isClosing || sidebarWidth == null || $(e.target).hasClass('ordersides')) return;

		//leaving finger on left edge should show tiny bit of sidebar after short while
		if (!isClosing) {
			sidebarTeaser = setTimeout(function() {
				//ensure deltas are also equal to the final values
				finalPageX = 0;
				finalT = 0;

				var newE = $.Event('mousemove');
				newE.target = e.target;
				newE.pageX = HOT_EDGE_WIDTH;
				$(document).trigger(newE);
			}, 100);

			//prevent any long press actions
			//FIXME: also prevents scroll action for (isScroll == 1) for !isClosing!
			//e.preventDefault();
		}

		//initialize values
		finalPageX = pointer.x;
		finalPageY = pointer.y;
		finalT = new Date().getTime();
		if ($sidebar.css('translate'))
			currentTranslateX = $sidebar.css('translate')[0];
		else if (isClosing)
			currentTranslateX = sidebarWidth;
		else
			currentTranslateX = 0;

		//animate
		$sidebar.transition('none');
		$blinds.css('height', 'auto').transition('none');
	}).on('touchmove mousemove', function(e) {
		if (!isDragging()) return;

		var pointer = getCoordinates(e);

		//check if sidebar was initially open
		if (isSidebarOpen()) {
			//disable drag sidebar + disable prevent scroll if in sidebar and deltaY > deltaX.
			//this setting is "sticky" for the rest of the drag. behavior won't change once set.
			if (!isDraggingSidebar(pointer, $(e.target).is('.topbun .boxedin')))
				return;
		} else {
			//disable drag sidebar + disable prevent scroll if first mousemove and deltaY > deltaX.
			//this setting is "sticky" for the rest of the drag. behavior won't change once set.
			if (!isDraggingSidebar(pointer, !hasBeenMoved()))
				return;
		}

		//prevent scrolling on mobile browsers, prevent user-select on desktop browsers
		e.preventDefault();

		//teaser should only be shown when no mousemoves preceded it...
		preventSidebarTeaser();

		//update stats
		initialPageX = finalPageX;
		initialT = finalT;
		finalPageX = pointer.x;
		finalPageY = pointer.y;
		finalT = new Date().getTime();
		currentTranslateX = Math.max(0, Math.min(sidebarWidth, currentTranslateX + finalPageX - initialPageX));

		//animate
		$sidebar.translate(currentTranslateX, 0);
		$blinds.css('opacity', (0.7 * currentTranslateX / sidebarWidth).toFixed(2));
	}).on('touchend touchcancel mouseup', function(e) {
		if (!isDragging()) return;

		//calculate end result of dragging
		var shouldCheck;
		if ($('#sidesordered').prop('checked'))
			shouldCheck = !(hasBeenMoved() && (currentTranslateX < sidebarWidth / 2 || (finalPageX - initialPageX) / (finalT - initialT) < -0.2));
		else
			shouldCheck = (hasBeenMoved() && (currentTranslateX > sidebarWidth / 2 || (finalPageX - initialPageX) / (finalT - initialT) > 0.2));

		//don't show teaser after the drag ended
		preventSidebarTeaser();

		//corrections for isDragging()
		finalPageX = null;

		//animate
		$sidebar.transition('').transform('');
		var blindsClickHandler = (function() {
			//when fading away $blinds, it will still be a valid label for #sidesordered
			//make sure that any subsequent clicks to $blinds don't toggle #sidesordered
			var firstClick = true;
			return function(e) {
				if (firstClick) firstClick = false;
				else e.preventDefault();
			};
		})();
		var transitionEndHandler = (function() {
			var triggered = false;
			return function() {
				//hide $blinds AFTER it's faded away to get a smooth transition
				if (triggered) return;
				triggered = true;
				$blinds.css('height', '').off('click', blindsClickHandler);
			};
		})();
		$blinds.css('opacity', '').transition('').show().one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', transitionEndHandler).on('click', blindsClickHandler);
		if (currentTranslateX < HOT_EDGE_WIDTH) transitionEndHandler(); //transitionend sometimes not fired if transition is too short (or nonexistent)
		else setTimeout(transitionEndHandler, 250); //just in case browser doesn't support transitionend event...
		$('#sidesordered').prop('checked', shouldCheck).trigger('change');
	}).on('click', function(e) {
		if (!hasBeenMoved()) return;
		//prevent #sidesordered getting incorrectly toggled again after mouseup, causing wrong final position for sidebar
		e.preventDefault();
	});
}

$(document).ready(function() {
	initializeJqueryExtensions();
	deobfuscateEmail();
	enableScaleMobile();
	initialScrollMobile();
	enhanceSidebar();
});

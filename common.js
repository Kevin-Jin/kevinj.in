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
	var initialPageX = null, finalPageX = null, initialT, finalT, finalPageY, currentTranslateX, lastBgUpdate, sidebarTeaser = null, isScroll = -1, HOT_EDGE_WIDTH = 16;

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
	var setTransition = function($self, value) { $self.css('-webkit-transition', value).css('transition', value); };
	var setTransform = function($self, value) { $self.css('-webkit-transform', value).css('-ms-transform', value).css('transform', value); };

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
		lastBgUpdate = finalT;

		//animate
		setTransition($sidebar, 'none');
		$blinds.css('height', 'auto');
		setTransition($blinds, 'background 0.25s');
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
		setTransform($sidebar, 'translate(' + currentTranslateX + 'px,0)');
		if (finalT - lastBgUpdate > 250) {
			//limit the background updates due to slowdowns on mobile browsers
			$blinds.css('background', 'rgba(0, 0, 0, ' + (0.7 * currentTranslateX / sidebarWidth) + ')');
			lastBgUpdate = finalT;
		}
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
		setTransition($sidebar, '');
		setTransform($sidebar, '');
		$blinds.css('height', '').css('background', '');
		setTransition($blinds, '');
		$('#sidesordered').prop('checked', shouldCheck).trigger('change');
	}).on('click', function(e) {
		if (!hasBeenMoved()) return;
		//prevent #sidesordered getting incorrectly toggled again after mouseup, causing wrong final position for sidebar
		e.preventDefault();
	});
}

$(document).ready(function() {
	deobfuscateEmail();
	enableScaleMobile();
	initialScrollMobile();
	enhanceSidebar();
});

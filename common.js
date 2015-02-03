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
	var initialPageX = null, finalPageX = null, initialT, finalT, finalPageY, currentTranslateX, removeTransition, sidebarTeaser = null, isScroll = -1, HOT_EDGE_WIDTH = 16;

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
		if (pointer.x > HOT_EDGE_WIDTH && !isClosing || sidebarWidth == null || $(e.target).parents('.mobiletopbun').length) return;

		//leaving finger on left edge should show tiny bit of sidebar after short while
		removeTransition = 1;
		if (!isClosing) {
			sidebarTeaser = setTimeout(function() {
				//ensure deltas are also equal to the final values
				finalPageX = 0;
				finalT = 0;

				var newE = $.Event('mousemove');
				newE.target = e.target;
				newE.pageX = HOT_EDGE_WIDTH;
				removeTransition = 0;
				$(document).trigger(newE);
			}, 200);

			//prevent any long press actions
			//FIXME: also prevents scroll action for (isScroll == 1) for !isClosing!
			//e.preventDefault();
		}

		//initialize values
		finalPageX = pointer.x;
		finalPageY = pointer.y;
		finalT = new Date().getTime();
		if ($sidebar.css('translate3d'))
			currentTranslateX = $sidebar.css('translate3d')[0];
		else if ($sidebar.css('translate'))
			currentTranslateX = $sidebar.css('translate')[0];
		else if (isClosing)
			currentTranslateX = sidebarWidth;
		else
			currentTranslateX = 0;

		//animate
		$blinds.css('height', 'auto');
	}).on('touchmove mousemove', function(e) {
		if (!isDragging()) return;

		var pointer = getCoordinates(e);
		if (pointer.x == finalPageX) return;

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
		if (removeTransition == 1) {
			//disables animations after teaser pops up
			$sidebar.transition('none');
			$blinds.transition('none');
			removeTransition = 2;
		} else if (removeTransition == 0) {
			removeTransition = 1;
		}
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
		$('#sidesordered').prop('checked', shouldCheck).trigger('change');
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
	}).on('click', function(e) {
		if (!hasBeenMoved()) return;
		//prevent #sidesordered getting incorrectly toggled again after mouseup, causing wrong final position for sidebar
		e.preventDefault();
	});
}

function enhanceSearchbar() {
	if (canUse3dTransforms)
		$('.search').addClass('hwaccel');

	$('.search .cleartext label').on('click', function(e) {
		$('.searchbar input[name=query]').val('').trigger('keyup');
		e.preventDefault();
	});
	$('.searchbar input[name=query]').on('keyup', function(e) {
		if ($(this).val().length != 0)
			$('.search .cleartext').css('display', 'block');
		else
			$('.search .cleartext').css('display', 'none');
	}).trigger('keyup');
}

$(document).ready(function() {
	initializeJqueryExtensions();
	deobfuscateEmail();
	enhanceSidebar();
	enhanceSearchbar();
});

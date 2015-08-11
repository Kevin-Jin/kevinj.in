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
	var resultingEmail = $('<a class="obfuscated email" href="#"><span class="show">ni (TOD) jnivek</span><span class="hide">moc (TOD) elgoog</span><span class="show"> (TA) nivek</span></a>');

	//TODO: call a proper unicode BiDi algorithm
	var reverse = function(s) {
		var o = '';
		for (var i = s.length - 1; i >= 0; i--) {
			switch (s[i]) {
				case '(':
					o += ')';
					break;
				case ')':
					o += '(';
					break;
				default:
					o += s[i];
					break;
			}
		}
		return o;
	};

	// deobfuscate our email string as well as any DOM elements with the obfuscated class
	resultingEmail.add('.obfuscated').each(function(i) {
		var allText = '';
		$(this).children().each(function(j) {
			$this = $(this);
			if ($this.hasClass('show'))
				allText += $this.text();
		});
		allText = reverse(allText);
		allText = allText.replace(/\s?\((AT|DOT)\)\s?/g, function(match, cap) {
			switch (cap) {
				case 'AT':
					return '@';
				case 'DOT':
					return '.';
				default:
					throw '';
			}
		});
		$(this).text(allText);
	});

	// replace any links with the email class with our deobfuscated email
	$('a.email').attr('href', 'mailto:' + resultingEmail.text());
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
	var initialPageX = null, finalPageX = null, initialT, finalT, velX, finalPageY, currentTranslateX, removeTransition, sidebarTeaser = null, isScroll = -1, HOT_EDGE_WIDTH = 16;

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
	//TODO: inertia
	var sidebarWidth, defaultVel;
	$(window).on('resize', function(e) {
		if ($('.ordersides').css('display') == 'none')
			sidebarWidth = null;
		else
			sidebarWidth = $sidebar.width();
		/*var cssTransDur = $('.topbun .boxedin').css('transition-duration');
		if (cssTransDur.indexOf("ms") != -1)
			defaultVel = sidebarWidth / parseFloat(cssTransDur);
		else if (cssTransDur.indexOf("s") != -1)
			defaultVel = sidebarWidth / (parseFloat(cssTransDur) * 1000);
		else
			defaultVel = null;
		console.log(defaultVel);*/
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
		var isNoDragging = $.grep($.map($(e.target).parents(), function(x) { return $(x).hasClass('nosidebar'); }), function(a) { return a; }).length > 0
		if (pointer.x > HOT_EDGE_WIDTH && !isClosing || isNoDragging || sidebarWidth == null || $(e.target).parents('.mobiletopbun').length) return;

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

function enhanceTopBar() {
	if (typeof window.Modernizr === 'undefined') {
		window.Modernizr = new Object();
		window.Modernizr.csstransitions = false;
		window.Modernizr.csstransforms = false;
		window.Modernizr.csstransforms3d = false;
	}

	if (!window.Modernizr.csstransitions)
		return;

	originalAlpha = 0.25;
	animationHeight = 100;

	toggled = false;
	$('.topbun, .topbun .search').css('transition', 'none');
	$(window).on('resize scroll', function() {
		// $('.topbun').css('min-width') gives insight about our CSS mobile media query
		if ($('.topbun').css('min-width') !== '0px' && $(window).scrollTop() <= animationHeight) {
			toggled = true;
			$('.topbun').addClass('clean');
			$('.topbun').css('backgroundColor', $.Color($('.topbun').css('backgroundColor')).alpha(originalAlpha * Math.min(1, $('body').scrollTop() / animationHeight)));
		} else {
			if (toggled) {
				toggled = false;
				$('.topbun').removeClass('clean');
				$('.topbun').css('background', '');
			}
		}
	}).trigger('resize');
	$('.topbun, .topbun .search').css('transition', '');
}

function enhanceJump($enhanceLinks, milliseconds, extra) {
	$page = $('html, body');
	$enhanceLinks.click(function(){
		$slide = $(newSlideId = $.attr(this, 'href'));

		$page.on("scroll mousedown wheel DOMMouseScroll mousewheel keyup touchmove", function(){
			$page.stop();
		});
		$page.stop().animate({
			scrollTop: $slide.offset().top
		}, milliseconds, "swing", function() {
			$page.off("scroll mousedown wheel DOMMouseScroll mousewheel keyup touchmove");
		});

		if (extra)
			extra(newSlideId);
		return false;
	});
}

$(document).ready(function() {
	initializeJqueryExtensions();
	deobfuscateEmail();
	enhanceSidebar();
	enhanceSearchbar();
	enhanceJump($('.skipcover a'), 1000);
});

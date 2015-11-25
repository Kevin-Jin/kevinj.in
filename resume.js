// Chrome's print to PDF is targeted because of PhantomJS
function enhanceReadingOrder() {
	// in print to PDF on Chrome, this ensures bullet marks are placed before
	// the bullet text when bullet text spans multiple lines. you can test this
	// by opening the generated PDF in Adobe Reader -> Save As -> Text (Accessible).
	$('.entry li:not(.placeholder):not(.endline):not(.leftalign2col):not(.rightalign2col)').filter(':visible').before($('<li style="display: inline"></li>'));

	$.fn.insertAt = function($parent, i) {
		var $target = $parent.children().eq(i);

		if ($target.length)
			this.insertBefore($target);
		else
			this.appendTo($parent);

		return this;
	};

	// puts organization and space on the same line and contribution and time
	// on the same line, for the sake of reading order
	$(window).on('resize', function(e) {
		if ($('.ordersides').css('display') == 'none') {
			$('.firstline').each(function(i) {
				var $firstline = $(this);
				var $secondline = $firstline.siblings('.secondline');

				var $contribution = $secondline.children('.contribution');
				var $spacetime = $secondline.children('.spacetime');
				$secondline.children().unwrap();
				$contribution.children().css('order', '');

				$firstline.children('.contribution').children().insertAt($contribution, $firstline.children('.contribution').data('takefrom'));
				$firstline.children('.spacetime').children().insertAt($spacetime, $firstline.children('.spacetime').data('takefrom'));
				$firstline.remove();
			});
		} else {
			$('.entry').not('.oneline').children('.contribution').each(function(i) {
				var $roleparent = $(this);
				var $timeparent = $roleparent.siblings('.spacetime');
				var takeFrom;

				takeFrom = $roleparent.children('.organization').index();
				var $orgparent = $roleparent.clone();
				$orgparent.children().not('.organization').remove();
				$roleparent.children('.organization').remove();
				$orgparent.insertBefore($roleparent);
				$orgparent.data('takefrom', takeFrom);

				takeFrom = $timeparent.children('.space').index();
				var $spaceparent = $timeparent.clone();
				$spaceparent.children().not('.space').remove();
				$timeparent.children('.space').remove();
				$spaceparent.insertAfter($orgparent);
				$spaceparent.data('takefrom', takeFrom);

				$orgparent.add($spaceparent).wrapAll('<div style="position: relative" class="firstline"></div>');
				$roleparent.add($timeparent).wrapAll('<div style="position: relative" class="secondline"></div>');
				$roleparent.children().css('order', '0');
			});
		}
	}).trigger('resize'); //call resize on page load
	window.matchMedia('print').addListener(function(mql) {
		$(window).trigger('resize');
	});

	// TODO: figure out something that makes Chrome add blank lines to PDF text
	//$('.section h2, .entry').before($('<pre>&nbsp;</pre><br />'));
}

function enhancePrint() {
	$('.print').on('click', function(e) {
		window.print();
		e.preventDefault();
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

	enhanceReadingOrder();
	enhancePrint();
});

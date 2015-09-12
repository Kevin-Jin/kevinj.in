// Chrome's print to PDF is targeted because of PhantomJS
function enhanceReadingOrder() {
	// in print to PDF on Chrome, this ensures bullet marks are placed before
	// the bullet text when bullet text spans multiple lines. you can test this
	// by opening the generated PDF in Adobe Reader -> Save As -> Text (Accessible).
	$('.entry li:not(.placeholder):not(.endline):not(.leftalign2col):not(.rightalign2col)').before($('<li style="display: inline"></li>'));
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

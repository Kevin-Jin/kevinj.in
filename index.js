$(document).ready(function() {
	var $sunglasses = $('.sunglasses'), $topbun = $('.topbun'), $headline = $('.headline'), $subtitle = $('.subtitle'), $otherBacon = $('.mugshot,.quicklinks,.inspirational');
	if (canUse3dTransforms) {
		$sunglasses.addClass('hwaccel');
		//$topbun.addClass('hwaccel');
		$headline.addClass('hwaccel');
		$subtitle.addClass('hwaccel');
		$otherBacon.addClass('hwaccel');
	}

	$sunglasses.css('opacity', '1').show().transition('opacity 1s').css('opacity' ,'');
	$topbun.css('opacity', '0');
	$headline.css('opacity', '0');
	$subtitle.css('opacity', '0');
	$otherBacon.css('opacity', '0');
	setTimeout(function() {
		$topbun.translate(0, -100).show().transition('opacity 1s, transform 1s').css('opacity' ,'').transform('');
		$headline.translate(100, 0).show().transition('opacity 1s, transform 1s').css('opacity' ,'').transform('');
		$subtitle.translate(-100, 0).show().transition('opacity 1s, transform 1s').css('opacity' ,'').transform('');
		$otherBacon.translate(0, 100).show().transition('opacity 1s, transform 1s').css('opacity' ,'').transform('');
	}, 400);
});

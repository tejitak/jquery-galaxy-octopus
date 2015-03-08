var $ = require("jquery");

// register requestAnimationFrame to global
(function (w, r) {
    w['r'+r] = w['r'+r] || w['webkitR'+r] || w['mozR'+r] || w['msR'+r] || w['oR'+r] || function(c){ w.setTimeout(c, 1000 / 60); };
})(window, 'equestAnimationFrame');

// constants
var CANVAS_CLASS =".canvas";
var OCTOPUS_CLASS = ".octopus";
var COUNT_CLASS = ".count";
var PIPE_CLASS = ".pipe";
var PIPE_INTERVAL = 1600;
var GAP_HEIGHT = 120;

// setting
var REVERSE_CHECKBOX = "#reverseGravity";
var reverse = true;

var _pipeTimer = null;
var _hitting = false;

// main loop to check octopus position and detect collision
var watchPos = function(){
    if(_pipeTimer){
        window.requestAnimationFrame(watchPos);
        var res = detectCollision();
        if(!res){ return; }
        if(res.state === "HIT" && !_hitting){
            // collision detected & game end
            end();
        }else if(res.state === "SUCCESS"){
            updateCount(res.count);
        }
    }
};

// create and move a pipe
var startPipeMove = function(){
    var count = 0;
    var createPipe = function(){
        count++;
        var $canvas = $(CANVAS_CLASS),
            topH = Math.floor(Math.random() * ($canvas.height() - 250)) + 50,
            bottomH = $canvas.height() - (topH + GAP_HEIGHT),
            $pipe = $('<div class="pipe" data-count="' + count + '"><div style="height: ' + topH + 'px" class="pipeTopHalf"></div><div style="height:' + bottomH + 'px" class="pipeBottomHalf"></div></div>');
        // insert to canvas and start moving
        $pipe.appendTo($canvas).animate({
            right: '+=' + ($canvas.width() + $pipe.width()) + 'px'
        }, PIPE_INTERVAL * 2, 'linear', function(){
            $pipe.remove();
        });
    };
    return setInterval(function(){
        createPipe();
    }, PIPE_INTERVAL);
};

var updateCount = function(count){
    $(COUNT_CLASS).text(count);
};

var detectCollision = function(){
    var $octopus = $(OCTOPUS_CLASS);
    if(parseInt($octopus.css('bottom')) === (reverse ? $(CANVAS_CLASS).height() - $octopus.height() : 0)){
        return {state: "HIT"};
    }
    var $pipe = $(PIPE_CLASS).first();
    if($pipe.size() > 0){
        var pipeLeft = $pipe.offset().left,
            pipeRight = pipeLeft + $pipe.width(),
            octopusLeft = $octopus.offset().left,
            octopusRight = octopusLeft + $octopus.width();
        // detect left to right range
        if(octopusRight >= pipeLeft && octopusLeft <= pipeRight){
            var $pipeTop = $pipe.find('.pipeTopHalf');
            // detect bottom to top range
            if($octopus.offset().top < ($pipe.offset().top + $pipeTop.height()) || ($octopus.offset().top + $octopus.height()) > (($pipe.offset().top + $pipeTop.height()) + GAP_HEIGHT)){
                return {state: "HIT"};
            }
        } else if(octopusLeft >= pipeRight){
            return {state: "SUCCESS", count: $pipe.data('count')};
        }
    }
};

var fall = function(){
    var $dfd = $.Deferred(),
        $canvas = $(CANVAS_CLASS),
        $octopus = $(OCTOPUS_CLASS),
        canvasH = $canvas.height();
        octopusH = $octopus.height();
        octopusBottom = parseInt($octopus.css('bottom'));
    var pos = reverse ? canvasH - octopusBottom - octopusH : octopusBottom;
    var totalFallTime = 1000/*time for fall*/ * pos / canvasH;
    $octopus.stop().animate({
        bottom: reverse ? canvasH - octopusH : 0
    }, totalFallTime, 'linear', function(){
        $dfd.resolve();
    }).css('transform', 'rotate(' + (reverse ? '-' : '') + '90deg)');
    return $dfd;
};

var jump = function(){
    var $octopus = $(OCTOPUS_CLASS);
    $octopus.css('transform', 'rotate(' + (reverse ? '' : '-') + '20deg)').stop().animate({
        bottom: (reverse ? '-' : '+') + '=60px'
    }, 200, function(){
        $octopus.css('transform', 'rotate(0deg)').stop().animate({
            bottom: (reverse ? '+' : '-') + '=60px'
        }, 300, 'linear', function(){
            fall();
        });
    });
};

var start = (function(){
    return function(){
        // no actions are allowed while game ending
        if(_hitting){ return; }
        if(!_pipeTimer){
            $(OCTOPUS_CLASS).css('bottom', ($(CANVAS_CLASS).height() / 2) + "px");
            $(PIPE_CLASS).remove();
            updateCount(0);
            _pipeTimer = startPipeMove();
            watchPos();
        }
        jump();
    }
})();

var end = function(){
    _hitting = true;
    clearInterval(_pipeTimer);
    _pipeTimer = null;
    $(PIPE_CLASS).stop();
    fall().then(function(){
        _hitting = false;
    });
};

// listen tap & click and space key
$(CANVAS_CLASS).on("click touchstart", function(e){
    e.stopPropagation();
    e.preventDefault();
    start();
});
$(document).on("keydown", function(e){
    if(e.keyCode === 32){
        start();
    }
});

// settings
var updateSettings = function(){
    reverse = $(REVERSE_CHECKBOX).prop('checked');
};

$(".settings").on("click", function(e){
    updateSettings();
    e.stopPropagation();
}).on("keydown", function(e){
    if(e.keyCode === 32){
        updateSettings();
    }
    e.stopPropagation();
});
$(REVERSE_CHECKBOX).prop('checked', reverse);
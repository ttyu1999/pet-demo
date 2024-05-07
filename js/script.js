const navs = [
    $('#nav_about'),
    $('#nav_service'),
    $('#nav_contact'),
    $('#nav_portfolio')
];

const layers = [
    $('.about'),
    $('.service'),
    $('.contact'),
    $('.portfolio')
];

const getRandom = (min, max) => {
    return Math.random() * (max - min + 1) + min;
}

$('main .container h2').addClass('canStand');

const canStandItems = () => {
    return [...document.querySelectorAll('.slide.active .canStand'), ...document.querySelectorAll('main section.active:not(.banner)'), ...document.querySelectorAll('header .canStand'), ...document.querySelectorAll('.active .canStand')];
}

export let items = canStandItems();

let onlyCheckedOnce = true;
let isSwitching = false;

const tlBlobIn = gsap.timeline();
const tlTextIn = gsap.timeline();

const animatePlay = () => {
    const slideLength = document.querySelectorAll('.slide').length;
    
    const blobIn = () => {
        tlBlobIn.fromTo('.slide.active .blob path', 1.25, {
        x: '0%',
        y: '-75%',
        scale: 0.01,
        transformOrigin: '50% 50%',
        ease: 'back.out(1.5)',
        }, {
            x: '0%',
            y: '0%',
            scale: 0.05,
            transformOrigin: '50% 50%',
            ease: 'back.out(1.5)',
        }, 0)
        .to('.slide.active .blob path', {
            scale: 2,
            transformOrigin: '50% 50%',
            ease: 'power2.in',
            duration: 0.7,
        }, 1.25)
        .to('.slide.active .blob path', {
            scale: 1,
            transformOrigin: '50% 50%',
            ease: 'back.out(1.5)',
            duration: 0.5,
        }, 2);
    }
    
    const textIn = () => {
        tlTextIn.fromTo('.slide.active .wrap', 1, {
            x: '-50%',
            y: '0%',
            opacity: 0,
            ease: 'power2.out',
        },
        {
            x: '0%',
            y: '0%',
            opacity: 1,
            ease: 'power2.out',
        }, 1)
        .fromTo('.slide.active .type_text', 1, {
            x: '-25%',
            y: '0%',
            opacity: 0,
            ease: 'power2.out',
        },
        {
            x: '0%',
            y: '0%',
            opacity: 1,
            ease: 'power2.out',
        }, 2);
    }

    blobIn();
    textIn();

    let counter = 1;
        
    const switchPrev = () => {
        return counter > 1 ? counter-- : counter = slideLength;
    }
    
    const switchNext = () => {
        return counter < slideLength ? counter++ : counter = 1;
    }
    
    const switchHandler = (prevOrNext) => {
        if (!isSwitching) {
            isSwitching = true;
            tlBlobIn.reverse();
            tlTextIn.reverse();


            tlBlobIn.eventCallback('onReverseComplete', () => {
                prevOrNext();
                switchSlider();
                isSwitching = false;
            });
        }
    }

    const switchSlider = () => {
        $('.slide').removeClass('active');
        $(`
        .portfolio .type_text,
        .portfolio .year_text,
        .portfolio .title_text
        `).removeClass('canStand');
        
        $(`.slide:nth-of-type(${counter})`).addClass('active');

        $(`
        .portfolio .active .type_text,
        .portfolio .active .year_text,
        .portfolio .active .title_text
        `).addClass('canStand');

        items = canStandItems();

        blobIn();
        textIn();
        tlBlobIn.play(0);
        tlTextIn.play(0);
        
        isSwitching = false;
    }

    
    $('.button-prev').click(() => {
        switchHandler(switchPrev);
    });
    
    $('.button-next').click(() => {
        switchHandler(switchNext);
    });
}



navs.forEach((nav, index) => {
    nav.change(function() {
        layers.forEach((layer, i) => {
            if (i !== index) {
                layer.css({
                    opacity: '0',
                    visibility: 'hidden'
                });
            }
            layer.removeClass('active');
            $('.banner').removeClass('active');
        });

        if ($(this).is(':checked')) {
            if (index === 3 && onlyCheckedOnce) {
                onlyCheckedOnce = false;

                $('.slide:nth-of-type(1)').addClass('active');

                $(`
                .portfolio .active .type_text,
                .portfolio .active .year_text,
                .portfolio .active .title_text
                `).addClass('canStand');

                animatePlay();
            }

            layers[index].addClass('active');
            items = canStandItems();

            layers[index].css({
                opacity: '1',
                visibility: 'visible'
            });

            $('.banner').css({
                opacity: '0',
                visibility: 'hidden'
            });


            let h = Math.round(Math.random() * 360);
            let s = Math.round(Math.random() * 50);
            let l = Math.round(getRandom(5, 90));

            if (l < 30) {
                $('html').css('--main-color', `hsl(${h}deg ${s}% ${( (100 - l) * 1.5 ) < 100 ? (100 - l) * 1.5 : 85}%)`);
            } else if (l > 70) {
                $('html').css('--main-color', `hsl(${h}deg ${s}% ${(100 - l)}%)`);
            } else {
                if (l <= 60) {
                    $('html').css('--main-color', `hsl(${h}deg ${s}% 90%)`);
                } else {
                    $('html').css('--main-color', `hsl(${h}deg ${s}% 15%)`);
                }
            }

            $('html').css('--bg-color', `hsl(${h}deg ${s}% ${l}%)`);
        }
    });
});


$('#shape image').mouseenter(() => {
    $('.slide.active .blob path').addClass('hover');
});
  
$('#shape image').mouseleave(() => {
    $('.slide.active .blob path').removeClass('hover'); 
});

$('.contact form').submit(e => e.preventDefault());


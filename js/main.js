const {label, input, hr, div, h1, h4, a, span, makeDOMDriver, button, p, br, h2, header, nav, ul, li, img, i} = CycleDOM;
const isolate = CycleIsolate; 
  
function main(sources){ 

  let helloTree$ = isolate(headerModule)(sources).DOM;  
 
  vtree$ = helloTree$
  
  return {
      DOM: vtree$
  }; 
}

const drivers = {
  DOM: makeDOMDriver('#app')
}

Cycle.run(main, drivers);

function headerModule(sources){

  let vtree$;
    
  vtree$ = Rx.Observable.of(
            header([
              nav([
                div('.nav-wrapper',[
                    carouselModule(sources).DOM
                ])      
              ]),
              sideNavModule(sources).DOM
            ])
           );  
    
  return {
    DOM: vtree$
  };

}

function sideNavModule(sources){

  let vtree$;
    
  let getClickText$ = sources.DOM.select('.collapsible-header').events('click').map(ev => {
    let $target = $(ev.currentTarget);
    $target.toggleClass('active');
    accordionOpen($target);  
  }).startWith('');

  vtree$ = getClickText$.map(()=>
            ul('.side-nav .fixed #nav-mobile',[
                li('.side-nav-top',[
                    span('#logo',[
                        img({src:'https://material.google.com/static/images/nav_google_logo.svg'})
                    ]),
                    a('.btn-floating .btn-large .waves-effect .waves-light .green',[
                        i('.material-icons','add')    
                    ])
                ]),
                li('.no-padding',[
                    ul('.collapsible .collapsible-accordion',[
                        li('.bold',[
                            a('.collapsible-header .waves-effect .waves-teal','CSS'),
                            div('.collapsible-body',[
                                ul([
                                    li([
                                        a('Color'),
                                        a('Grid'),
                                        a('Helplers')
                                    ])
                                ])
                            ])
                        ]),
                        li('.bold',[
                            a('.collapsible-header .waves-effect .waves-teal','Components'),
                            div('.collapsible-body',[
                                ul([
                                    li([
                                        a('Badges'),
                                        a('Buttons'),
                                        a('Breadcrumbs')
                                    ])
                                ])
                            ])
                        ]),
                        li('.bold',[
                            a('.collapsible-header .waves-effect .waves-teal','Javascript'),
                            div('.collapsible-body',[
                                ul([
                                    li([
                                        a('Carousel'),
                                        a('Collapsible'),
                                        a('Dialogs')
                                    ])
                                ])
                            ])
                        ])
                    ])
                ])
              ])
      );
    
  return {
    DOM: vtree$
  };

}

function carouselModule(sources){

  let thing;

  let watchCarousel$ = sources.DOM.select('.carousel').observable.subscribe((el)=>{
    if(el.length){
        thing = testCarousel($(el));
        watchCarousel$.dispose();
    }   
  });
    
  let clickStreamRight$ = sources.DOM.select('.carousel .carousel-item .right').events('click').map(ev => {
        return 1;    
  });
    
  let clickStreamLeft$ = sources.DOM.select('.carousel .carousel-item .left').events('click').map(ev => {
        return -1;   
  });
    
  Rx.Observable.merge(clickStreamRight$, clickStreamLeft$).subscribe((indicator)=>{
        thing.carousel('next',indicator);
        //$('.carousel').trigger('carouselNext', [indicator]);                                                                           
  });

  let vtree$;
  vtree$ = Rx.Observable.of(
            div('.carousel .carousel-slider .center .noselect',[
              div('.carousel-item .red .white-text',{attrs:{data:{month:6,year:2016}}},[
                  h2('June 2016'),
                  i('.material-icons .arrow .left','keyboard_arrow_left'),
                  i('.material-icons .arrow .right','keyboard_arrow_right')
              ]),
              div('.carousel-item .amber .white-text',{attrs:{data:{month:7,year:2016}}},[
                  h2('July 2016'),
                  i('.material-icons .arrow .left','keyboard_arrow_left'),
                  i('.material-icons .arrow .right','keyboard_arrow_right')
              ]),
              div('.carousel-item .green .white-text',{attrs:{data:{month:8,year:2016}}},[
                  h2('August 2016'),
                  i('.material-icons .arrow .left','keyboard_arrow_left'),
                  i('.material-icons .arrow .right','keyboard_arrow_right')
              ]),
              div('.carousel-item .blue .white-text',{attrs:{data:{month:9,year:2016}}},[
                  h2('September 2016'),
                  i('.material-icons .arrow .left','keyboard_arrow_left'),
                  i('.material-icons .arrow .right','keyboard_arrow_right')
              ]),
              div('.carousel-item .purple .white-text',{attrs:{data:{month:10,year:2016}}},[
                  h2('October 2016'),
                  i('.material-icons .arrow .left','keyboard_arrow_left'),
                  i('.material-icons .arrow .right','keyboard_arrow_right')
              ])
            ])
           );
    
  return {
    DOM: vtree$
  };

}


function accordionOpen(object) {
    $panel_headers = object.parent().parent().find('> li > .collapsible-header');
    if (object.hasClass('active')) {
        object.parent().addClass('active');
    }
    else {
        object.parent().removeClass('active');
    }
    if (object.parent().hasClass('active')){
      object.siblings('.collapsible-body').stop(true,false).slideDown({ duration: 350, easing: "easeOutQuart", queue: false, complete: function() {$(this).css('height', '');}});
    }
    else{
      object.siblings('.collapsible-body').stop(true,false).slideUp({ duration: 350, easing: "easeOutQuart", queue: false, complete: function() {$(this).css('height', '');}});
    }

    $panel_headers.not(object).removeClass('active').parent().removeClass('active');
    $panel_headers.not(object).parent().children('.collapsible-body').stop(true,false).slideUp(
      {
        duration: 350,
        easing: "easeOutQuart",
        queue: false,
        complete:
          function() {
            $(this).css('height', '');
          }
      });
}

/*
    // Initialize Firebase
    var config = {
      apiKey: "AIzaSyC7eDuSl0CfhDQ95wEXhaNFNHcT3nlxPGs",
      authDomain: "networth-8b077.firebaseapp.com",
      databaseURL: "https://networth-8b077.firebaseio.com",
      storageBucket: "",
      messagingSenderId: "441384900863"
    };
    firebase.initializeApp(config);
*/


//$('.carousel.carousel-slider').carousel({full_width: true});
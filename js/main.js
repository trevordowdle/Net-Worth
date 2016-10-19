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
  
/*
  let getRandom$ = sources.DOM.select('.hello').events('click').map(ev => {
    return Math.random(); 
  }).startWith(""); 
*/
    
  vtree$ = Rx.Observable.of(
            header([
              nav([
                div('.nav-wrapper',[
                    /*span('carouselHere')*/
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
    /*
    let $target = $(ev.currentTarget.parentElement);
    $target.parent().find('li').removeClass('active');
    $target.addClass('active');
    */   
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

  let vtree$;

  vtree$ = Rx.Observable.of(
            div('.carousel .carousel-slider .center',[
              div('.carousel-item .red .white-text',[
                  h2('June 2016')
              ]),
              div('.carousel-item .amber .white-text',[
                  h2('July 2016')
              ]),
              div('.carousel-item .green .white-text',[
                  h2('August 2016')
              ]),
              div('.carousel-item .blue .white-text',[
                  h2('September 2016')
              ]),
              div('.carousel-item .purple .white-text',[
                  h2('October 2016')
              ])
            ])
           );
    
  vtree$.subscribe(()=>{
      //$('.carousel.carousel-slider').carousel({full_width: true});
      //document not ready yet
  }); 
    
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
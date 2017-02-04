const {label, input, hr, div, h1, h4, a, span, makeDOMDriver, button, p, br, h2, header, nav, ul, li, img, i, main, select, option} = CycleDOM;
const isolate = CycleIsolate; 
  
function page(sources){ 

  let headerTree$ = isolate(headerModule)(sources).DOM;
  let mainTree$ = mainModule(sources).DOM;
    
  let vtree$ = Rx.Observable.combineLatest(headerTree$, mainTree$, (headerTree, mainTree) =>
                    div([
                        headerTree,
                        mainTree
                    ])
                );
  
  return {
      DOM: vtree$
  }; 
}

const drivers = {
  DOM: makeDOMDriver('#app')
}

//firebase.auth().signOut();

initApp = function() {

    var userLookup, index;
    index = location.href.indexOf('user=');
    if(index >= 0){
        userLookup = location.href.substring(index+5);
    }

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            if(user.sendEmailVerification && !user.emailVerified){
                if(!localStorage.getItem(user.uid)){
                    user.sendEmailVerification();
                    localStorage.setItem(user.uid,'true');   
                }
            }
            userData.accountName = user.displayName;
            userData.accountURL = user.photoURL || 'img/anony.jpg';
            utility.setDatabase(user.uid);
            Cycle.run(page, drivers);
        } else {
            if(userLookup === 'test'){
                firebase.auth().signInWithEmailAndPassword('test@test.com', 'joejoe').catch(function(error) {
                    // Handle Errors here.
                    var errorCode = error.code;
                    var errorMessage = error.message;
                    // ...
                });
            }
            else{
                Cycle.run(loginModule, drivers);
            }
        }
    }, function(error) {
    console.log(error);
    });
};

window.addEventListener('load', function() {
    initApp()
});

function headerModule(sources){

  let vtree$;
    
  vtree$ = Rx.Observable.of(
            header([
              nav([
                div('.nav-wrapper',[
                    carouselModule(sources).DOM
                ])      
              ]),
              sideNavModule(sources).DOM,
              modalModule(sources).DOM,
              modalModule(sources,{
                                    selector: '#modal2 .modal',
                                    disabled: true,
                                    title: 'Edit Entry',
                                    buttons: [
                                        {
                                            text:'UPDATE',
                                            doClick: updateClick,
                                            selector:'.modal-action-update'

                                        },
                                        {
                                            text:'REMOVE',
                                            doClick: removeClick,
                                            selector:'.modal-action-remove',
                                            float:'.left '
                                        }
                                    ]
                                  }).DOM
            ])
           ); 
  return {
    DOM: vtree$
  };

}

function mainModule(sources){

      let vtree$;

sources.DOM.select('.logout')
.events('click')
.subscribe(()=>{
    firebase.auth().signOut();    
});
    
  vtree$ = Rx.Observable.of(
        main([
            div([
                div('.row',[
                    br(),
                    div('.col .s12 .m12 .l6',[
                        div([
                            div('#chart_Asset')
                        ])
                    ]),
                    div('.col .s12 .m12 .l6',[
                        div([
                            div('#chart_Debt')
                        ])
                    ]),
                    div('.row .networth-header',{style: {visibility: 'hidden'}},[
                        div('.col .s4 .m4 .l4 .assets',[
                            label('Assets: '),
                            span('.green-text','')
                        ]),
                        div('.col .s4 .m4 .l4 .debts',[
                            label('Debts: '),
                            span('.red-text','')
                        ]),
                        div('.col .s4 .m4 .l4 .networth',[
                            label('Net Worth: '),
                            span('.green-text .text-darken-3','')
                        ])
                    ]),
                    div('.col .s12 .m12 .l12',[
                        div('#curve_chart')
                    ]),
                    div('.col .s12 .m12 .l12',[
                        br(),
                        /*
                        p('Beta Application'),
                        button('.logout','logout'),
                        */
                        br()
                    ])
                ])
            ])
        ])
  ); 

  return {
    DOM: vtree$
  };

                
}
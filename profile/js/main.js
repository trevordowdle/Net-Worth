const {label, input, hr, div, h1, h4, a, span, makeDOMDriver, button, p, br, h2, header, nav, ul, li, img, i, main, select, option} = CycleDOM;
  
function page(sources){ 

  let headerTree$ = headerModule(sources).DOM;
  let mainTree$ = mainModule(sources).DOM;
    
  let vtree$ = Rx.Observable.combineLatest(headerTree$, mainTree$, (headerTree, mainTree) =>
                    div([
                        headerTree,
                        br(),
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


function headerModule(sources){
   let watchNav$ = sources.DOM.select('.nav')
                .observable
                .subscribe((el)=>{
                    if(el.length){
                        utility.watchData(el);
                        watchNav$.dispose();
                    }   
                });

    let vtree$ = Rx.Observable.of(
        nav('.nav',{style:'height:120px;'},[
            div('.nav-wrapper',[
                a('.brand-logo .center','NetWorth'),
                img('.profileImg .center'),
                label('.name .center')
                /*ul('#nav-mobile .left',[
                    li([
                        a('Sass')    
                    ]),
                    li([
                        a('Components')
                    ]),
                    li()[
                        a('JavaScript')
                    ]
                ])*/
            ])
        ])
    );
  
    return {
        DOM: vtree$
    }; 

}

function mainModule(sources){

    let vtree$ = Rx.Observable.of(
        div([
            p('main')
        ])
    );
  
    return {
        DOM: vtree$
    };

}

//firebase.auth().signOut();

initApp = function() {

    var userLookup, index;
    index = location.href.indexOf('user=');
    if(index >= 0){
        userLookup = location.href.substring(index+5);
    }
    debugger;

    if(userLookup){
        console.log(userLookup);
        utility.setDatabase(userLookup);
        Cycle.run(page, drivers);
        return false;
    }
    else{
        Cycle.run(mainModule,drivers);
    }

/*

    firebase.auth().onAuthStateChanged(function(user) {

        if (user) {
            userData.accountName = user.displayName;
            userData.accountURL = user.photoURL;
            //utility.setDatabase(user.uid);
            //Cycle.run(page, drivers);
        } else {
            
        }
    }, function(error) {
    console.log(error);
    });

*/
    

    

    //location.href.substring(location.href.indexOf('user=')+5)
/*
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            userData.accountName = user.displayName;
            userData.accountURL = user.photoURL;
            utility.setDatabase(user.uid);
            Cycle.run(page, drivers);
        } else {
            Cycle.run(loginModule, drivers);
        }
    }, function(error) {
    console.log(error);
    });
*/
};

window.addEventListener('load', function() {
    initApp();
});
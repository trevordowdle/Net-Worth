
let ui;

function loginModule(sources){ 

  console.log('loaded');
  document.body.style.backgroundColor = '#4caf50';

  let uiConfig = {
        'callbacks': {
          'signInSuccess': function(currentUser, credential, redirectUrl) {
            document.body.style.backgroundColor = '';
            $('.login-inner').hide();
            // Do something.
            // Return type determines whether we continue the redirect automatically
            // or whether we leave that to developer to handle.
            return true;
          }
        },
        'signInFlow':'popup',
        'signInOptions': [
            // Leave the lines as is for the providers you want to offer your users.
            firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            //firebase.auth.FacebookAuthProvider.PROVIDER_ID,
            //firebase.auth.TwitterAuthProvider.PROVIDER_ID,
            /*firebase.auth.GithubAuthProvider.PROVIDER_ID,*/
            firebase.auth.EmailAuthProvider.PROVIDER_ID
        ],
        // Terms of service url.
        'tosUrl': 'index.html'
    };

  sources.DOM.select('#firebaseui-auth-container')
    .observable
    .subscribe((el)=>{
        if(el.length){
            if(!ui){
                ui = new firebaseui.auth.AuthUI(firebase.auth());
            }
            // The start method will wait until the DOM is loaded.
            ui.start('#firebaseui-auth-container', uiConfig);
        }   
    });

  let vtree$ = Rx.Observable.of(
                div('.login-outer',[
                    div('.login-middle',[
                        div('.login-inner .z-depth-4',[
                            span('#logo2 .noselect',[
                                /*img({src:'https://material.google.com/static/images/nav_google_logo.svg'}),*/
                                img({src:'img/logo.png',style:{'width':'100px'}})
                            ]),
                            p('Track your Net Worth'),
                            br(),
                            div('#firebaseui-auth-container'),
                            div({style:{'padding':'10px'}},[
                                 a({'href':'terms.html','target':'_blank',style:{'color':'grey'}},[
                                    span('Terms Of Use')
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

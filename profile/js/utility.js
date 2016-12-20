
var userDatabase,
    userData = {}; // get user database


var utility = function(){
    
        // Initialize Firebase
    let config = {
      apiKey: "AIzaSyC7eDuSl0CfhDQ95wEXhaNFNHcT3nlxPGs",
      authDomain: "networth-8b077.firebaseapp.com",
      databaseURL: "https://networth-8b077.firebaseio.com",
      storageBucket: "",
      messagingSenderId: "441384900863"
    };
    firebase.initializeApp(config);
    
    let $el, $assetEl, $debtEl;

    google.charts.load('current', {'packages':[/*'corechart',*/'line']});
    google.charts.setOnLoadCallback(()=>{
        //either use promises or somehow use rxjs to combine the data and the chart callback for when both are ready.
        console.log('google charts loaded');
    });

    
    
    obj = {
        monthMap : {
          1: 'January',
          2: 'Feburary',
          3: 'March',
          4: 'April',
          5: 'May',
          6: 'June',
          7: 'July',
          8: 'August',
          9: 'September',
          10: 'October',
          11: 'November',
          12: 'Decemeber'
        },
        setDatabase:function(uid){
            userDatabase = firebase.database().ref(uid);    
        },
        updateProfile:function(){
            let updateObj = {};
            if(!userData.entries.displayName){
                updateObj.displayName = userData.accountName;
            }
            updateObj.photoURL = userData.accountURL;
            userDatabase.update(updateObj);  
        },
        watchData:function(el){
            
            let firstSnapshot, utilityThis = this;
            $el = $(el);

            userDatabase.on("value", function(snapshot) {
               let data = snapshot.val();
               userData.entries = data.entries || {};
            
               if(!firstSnapshot){
                   userData.displayName = data.displayName;
                   userData.photoURL = data.photoURL;
                   $el.find('.profileImg')[0].src = userData.photoURL;
                   $el.find('.name').text(userData.displayName);
                   console.log($el);
               }

            });
        
        },
        updateData:function(entry){
            let updateObj = {}, 
            refStr = 'entries/'+this.getReferenceStr(userData.currentMonth,userData.currentYear),
            netWorthData;
            if(!userData.entries[refStr]){
                userData.entries[refStr] = {};
            }
            if(!userData.entries[refStr][entry.type]){
                userData.entries[refStr][entry.type] = {};
            }
            userData.entries[refStr][entry.type][entry.name] = entry.value;
            netWorthData = this.getNetWorth(userData.entries[refStr]);
            if(netWorthData.Net !== null){
                updateObj[refStr+'/NetWorth'] = parseFloat(netWorthData.Net).toFixed(2);
                updateObj[refStr+'/Assets'] = parseFloat(netWorthData.Assets).toFixed(2);
                updateObj[refStr+'/Debts'] = parseFloat(netWorthData.Debts).toFixed(2);
            } else{
                updateObj[refStr+'/NetWorth'] = null;
                updateObj[refStr+'/Assets'] = null;
                updateObj[refStr+'/Debts'] = null;
            }
            this.updateNetWorthValues(netWorthData)
            updateObj[refStr+'/'+entry.type+'/'+entry.name] = entry.value;
            userDatabase.update(updateObj);    
        }
    };

    return obj;
    
}();
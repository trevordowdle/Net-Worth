
var userDatabase,
    userData = {}; // get user database


var utility = function(profile){
    
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
    if(location.href.indexOf('/profile') >= 0){
        google.charts.load('current', {'packages':['corechart','line']});    
    }
    else{
        google.charts.load('current', {'packages':[/*'corechart',*/'line']});
    }
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
          12: 'December'
        },
        profileEdit:true,
        setDatabase:function(uid){
            userDatabase = firebase.database().ref(uid);    
        },
        updateUser:function(){
            let updateObj = {};
            updateObj.displayName = userData.displayName;
            userDatabase.update(updateObj);
        },
        updateProfile:function(){
            let updateObj = {};
            if(!userData.displayName){
                updateObj.displayName = userData.accountName;
            }
            updateObj.photoURL = userData.accountURL;
            userDatabase.update(updateObj);  
        },
        watchData:function(el){
            
            let firstSnapshot, utilityThis = this;
            $el = $(el);
            $assetEl = $el.find('.asset').next().find('ul li');
            $debtEl = $el.find('.debt').next().find('ul li');

            userDatabase.on("value", function(snapshot) {
               let data = snapshot.val() || {};
               userData.entries = data.entries || {};
               userData.displayName = data.displayName;
               userData.photoURL = data.photoURL;

               if(!firstSnapshot){
                   userData.presentMonth = userData.currentMonth;
                   userData.presentYear = userData.currentYear;
                   firstSnapshot = true;
                   utilityThis.updateProfile();
                   let dataObj = utility.getDataObj();
                   populateNetWorthValues(dataObj,$assetEl,$debtEl);
               }

            });
        
        },
        watchDataProfile:function(el){
            
            let firstSnapshot, utilityThis = this;
            $el = $(el);

            userDatabase.on("value", function(snapshot) {
               let data = snapshot.val() || {};
               userData.entries = data.entries || {};
            
               if(!firstSnapshot){
                   firstSnapshot = true;
                   userData.displayName = data.displayName;
                   userData.photoURL = data.photoURL;
                   $el.find('.profileImg')[0].src = userData.photoURL;
                   $el.find('.name').text(userData.displayName);
                   let dateObj = utility.getDateObject();
                   userData.currentMonth = dateObj.month;
                   userData.currentYear = dateObj.year;
                   let dataObj = utility.getDataObj();
                   populateNetWorthGraph(dataObj);
                   console.log($el);
               }

            });
        
        },
        getReferenceStr(month,year){
            month = month < 10 ? '0'+month : month; 
            return year+''+month;
        },
        updateData:function(entry){
            let updateObj = {},
            refDate = this.getReferenceStr(userData.currentMonth,userData.currentYear),
            refStr = 'entries/'+refDate,
            netWorthData;
            if(!userData.entries[refDate]){
                userData.entries[refDate] = {};
            }
            if(!userData.entries[refDate][entry.type]){
                userData.entries[refDate][entry.type] = {};
            }
            userData.entries[refDate][entry.type][entry.name] = entry.value;
            netWorthData = this.getNetWorth(userData.entries[refDate]);
            if(netWorthData.Net !== null){
                updateObj[refStr+'/NetWorth'] = parseFloat(netWorthData.Net).toFixed(2);
                updateObj[refStr+'/Assets'] = parseFloat(netWorthData.Assets).toFixed(2);
                updateObj[refStr+'/Debts'] = parseFloat(netWorthData.Debts).toFixed(2);
            }
            else{
                updateObj[refStr+'/NetWorth'] = null;
                updateObj[refStr+'/Assets'] = null;
                updateObj[refStr+'/Debts'] = null;    
            }
            this.updateNetWorthValues(netWorthData)
            updateObj[refStr+'/'+entry.type+'/'+entry.name] = entry.value;
            userDatabase.update(updateObj);
            utility.populateValues(true); 
        },
        getDateObject:function(dateString){
            let date, dateObject = {};
            if(dateString){
                date = new Date(dateString);
            } 
            date = date || new Date();
            dateObject.date = date;
            dateObject.month = date.getMonth() + 1;
            dateObject.year = date.getFullYear();
            return dateObject;    
        },
        updateNetWorthValues:function(dataObj){
            let networthHeader = document.getElementsByClassName('networth-header')[0];
            if(dataObj.Net !== null){
                networthHeader.getElementsByClassName('networth')[0].getElementsByTagName('span')[0].textContent = '$' + parseFloat(dataObj.Net).toLocaleString(undefined, {maximumFractionDigits: 0, minimumFractionDigits: 0});
                networthHeader.getElementsByClassName('assets')[0].getElementsByTagName('span')[0].textContent = '$' + parseFloat(dataObj.Assets).toLocaleString(undefined, {maximumFractionDigits: 0, minimumFractionDigits: 0});
                networthHeader.getElementsByClassName('debts')[0].getElementsByTagName('span')[0].textContent = '$' + parseFloat(dataObj.Debts).toLocaleString(undefined, {maximumFractionDigits: 0, minimumFractionDigits: 0});
                networthHeader.style.visibility = "";
            }
            else{
                networthHeader.style.visibility = 'hidden';
            }
        },
        formatEntry(entry){
            let fractionIndicator = 2; 
            
            if(entry.type === "Asset"){
                entry.class = "green-text";
                entry.prefix = '$';
            }

            if(entry.type === "Debt"){
                entry.class = "red-text";
                entry.prefix = '$';
            }

            if(typeof entry.value === "string"){
                entry.value = parseFloat(entry.value.replace(/,/g,''));
            }

            if (isNaN(entry.value)) {
                entry.value = 0;
            }

            //entry.value = Math.abs(entry.value);
            if(entry.value % 1 === 0){
                fractionIndicator = 0;    
            }
            entry.display = entry.prefix + entry.value.toLocaleString(undefined, {maximumFractionDigits: fractionIndicator, minimumFractionDigits: fractionIndicator});

            return entry;    
        },
        populateValues(fromUpdate){
            let dataObj = this.getDataObj();
            if(fromUpdate && $('.side-nav li:nth-child(2) .entry-grey').length){
                drawLineGraph();
                return false;
            }
            populateNetWorthValues(dataObj,$assetEl,$debtEl);
        },
        getDataObj(){
            let refString = this.getReferenceStr(userData.currentMonth,userData.currentYear);
            let dataObj = userData.entries[refString], tempMonth, tempYear;
            if(!dataObj || !(dataObj.Asset || dataObj.Debt)){
                tempMonth = userData.currentMonth-1;
                tempYear = userData.currentYear;
                if(tempMonth === 0){
                    tempMonth = 12;
                    tempYear -= 1;
                }
                refString = this.getReferenceStr(tempMonth,tempYear);
                dataObj = userData.entries[refString];
                if(dataObj){
                    dataObj.entryGrey = true;
                }
            }
            else if(dataObj){
                dataObj.entryGrey = false;
            }
            return dataObj;
        },
        getNetWorth(obj){
            let Assets, Debts, Net, assetKeys, debtKeys, hit = false;
            if(!obj){
                obj = {};
            }
            if(!obj['Asset']){ //create a helper function that will check if something exists and if not create empty obj
                obj['Asset'] = {};
            }
            if(!obj['Debt']){ //create a helper function that will check if something exists and if not create empty obj
                obj['Debt'] = {};
            }
            assetKeys = Object.keys(obj['Asset']);
            debtKeys = Object.keys(obj['Debt']);
            
            Assets = assetKeys.reduce((prev,current)=>{
                if(obj['Asset'][current] !== null){
                    prev += obj['Asset'][current];
                    hit = true;
                }
                return prev;
            },0);
            Debts = debtKeys.reduce((prev,current)=>{
                if(obj['Debt'][current] !== null){
                    hit = true;
                    prev += obj['Debt'][current];
                }
                return prev;
            },0);
            Net = Assets - Debts;
            if(!hit){
                return {'Net':null};
            }
            return {'Net':Net,'Assets':Assets,'Debts':Debts};
        }
    };

    return obj;
    
}();
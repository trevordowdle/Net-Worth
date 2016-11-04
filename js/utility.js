
    // Initialize Firebase
    var config = {
      apiKey: "AIzaSyC7eDuSl0CfhDQ95wEXhaNFNHcT3nlxPGs",
      authDomain: "networth-8b077.firebaseapp.com",
      databaseURL: "https://networth-8b077.firebaseio.com",
      storageBucket: "",
      messagingSenderId: "441384900863"
    };
    firebase.initializeApp(config);

var userDatabase = firebase.database().ref('dowdle2'),
    userData = {}; // get user database

var utility = function(){
    
    let $el, $assetEl, $debtEl;
    
    
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
        watchData:function(el){
            
            let firstSnapshot, utilityThis = this;
            $el = $(el);
            $assetEl = $el.find('.asset').next().find('ul li');
            $debtEl = $el.find('.debt').next().find('ul li');

            userDatabase.on("value", function(snapshot) {
               userData.entries = snapshot.val();

               if(!firstSnapshot){
                   
                   userData.presentMonth = userData.currentMonth;
                   userData.presentYear = userData.currentYear;
                   
                   firstSnapshot = true;
                   populateNetWorthValues(userData.entries[utilityThis.monthMap[userData.currentMonth]+userData.currentYear],$assetEl,$debtEl);
               }

            });
        
        },
        updateData:function(entry){
            let updateObj = {};
    
            updateObj[this.monthMap[userData.currentMonth]+userData.currentYear+'/'+entry.type+'/'+entry.name] = entry.value;
            //debugger;
            userDatabase.update(updateObj);    
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
        formatEntry(entry){
            if(entry.type === "Asset"){
                entry.class = "green-text";
                entry.prefix = '$';
            }

            if(entry.type === "Debt"){
                entry.class = "red-text";
                entry.prefix = '-$';
            }

            entry.value = Math.abs(entry.value);
            entry.display = entry.prefix + entry.value.toLocaleString();

            return entry;    
        },
        populateValues(){
            populateNetWorthValues(userData.entries[this.monthMap[userData.currentMonth]+userData.currentYear],$assetEl,$debtEl);
        }
    };

    return obj;
    
}();
    
       /*
       netData = snapShotData['October2016'].Assets.map((data)=>{
           let key = Object.keys(data)[0];
           return [key,data[key]];
       });
       netData2 = snapShotData['October2016'].Debts.map((data)=>{
           let key = Object.keys(data)[0];
           return [key,data[key]];
       });   

       netData3 = Object.keys(snapShotData).reduce((prev,data)=>{ 
           //console.log(snapShotData[data].date); 
           let row = [new Date(snapShotData[data].date)];
           //console.log(row[0]);
           row = row.concat(snapShotData[data].Assets.reduce((prev,obj)=>{
               let key = Object.keys(obj)[0];
               prev[0] += obj[key];
               return prev;
           },[0]));

           row = row.concat(snapShotData[data].Debts.reduce((prev,obj)=>{
               let key = Object.keys(obj)[0];
               prev[0] += obj[key];
               return prev;
           },[0]));

           prev.push(row);
           return prev;

       },[]);  

      netData3 = netData3.map((row)=>{
        let net;
        net = row[1] - row[2];
        row.pop();
        row.pop();
        row.push(net);
        return row;
      });

      */

       //netData3.unshift(['Date'/*, 'Assets', 'Debts'*/,'Net']);

      //console.log(netData3);

       //google.charts.load('current', {'packages':['corechart']});
       //google.charts.setOnLoadCallback(drawChart);
    //}, function (error) {
       //console.log("Error: " + error.code);
   // });
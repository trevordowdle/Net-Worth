"use strict";function page(e){var t=headerModule(e).DOM,a=mainModule(e).DOM,r=Rx.Observable.combineLatest(t,a,function(e,t){return div([e,br(),t])});return{DOM:r}}function headerModule(e){var t=e.DOM.select(".nav").observable.subscribe(function(e){e.length&&(utility.profileEdit||(e[0].getElementsByClassName("logout")[0].hidden=!0),utility.watchDataProfile(e),t.dispose())}),r=e.DOM.select(".changeGraph").observable.subscribe(function(e){if(e.length){var t=e[0].getElementsByClassName("coverDiv")[0],a=e[0].nextElementSibling.getElementsByClassName("card-panel")[0];t.style.top=a.offsetTop+"px",t.style.left=a.offsetLeft+10+"px",t.style.width=a.offsetWidth-20+"px",r.dispose()}});e.DOM.select(".nav .nav-wrapper .name .edit").events("click").subscribe(function(e){var t=$(e.currentTarget.parentElement.parentElement);t.find(".name").hide(),userData.displayName?t.find(".input-field.col label").addClass("active"):t.find(".input-field.col label").removeClass("active"),t.find(".input-field.col input").val(userData.displayName).focus().parent().show()}),e.DOM.select(".nav .nav-wrapper .update").events("click").subscribe(function(e){var t=$(e.currentTarget.parentElement.parentElement),a=t.find(".input-field.col").hide().find("#name").val();return a?(userData.displayName=a,t.find(".name").after(t.find(".name i")),t.find(".name").show().text(a),void utility.updateUser()):(t.find(".name").after(t.find(".name i")),t.find(".name").show(),!1)}),e.DOM.select(".brand-logo").events("click").subscribe(function(e){location.href="/Net-Worth"});e.DOM.select(".logout").events("click").subscribe(function(e){firebase.auth().signOut(),location.href="/Net-Worth"});var s=e.DOM.select(".nav .nav-wrapper .name").events("mouseenter").map(function(e){return e}),n=e.DOM.select(".nav .nav-wrapper .name").events("mouseleave").map(function(e){return e});s.merge(n).subscribe(function(e){if(!utility.profileEdit)return!1;var t=$(e.currentTarget);"mouseenter"===e.type&&t.append($(".edit").removeClass("hide")),"mouseleave"===e.type&&"material-icons edit"!==e.fromElement.className&&$(".edit").addClass("hide")});e.DOM.select(".input-field input:not(.select-dropdown)").events("focus").map(function(e){e.currentTarget.nextSibling.className="active"}).startWith("").subscribe(function(){}),e.DOM.select(".input-field input:not(.select-dropdown)").events("blur").map(function(e){e.currentTarget.value||(e.currentTarget.nextSibling.className="")}).startWith("").subscribe(function(){console.log("blur")});e.DOM.select(".changeGraph button").events("click").subscribe(function(e){var t=$(e.target);t.addClass("active").siblings().removeClass("active"),populateNetWorthGraph(userData.entries[userData.keys[userData.lookup]])}),e.DOM.select(".arrow.left").events("click").subscribe(function(){userData.lookup-=1,userData.monthString=utility.getMonthString(),populateNetWorthGraph(userData.entries[userData.keys[userData.lookup]])}),e.DOM.select(".arrow.right").events("click").subscribe(function(){userData.lookup+=1,userData.monthString=utility.getMonthString(),populateNetWorthGraph(userData.entries[userData.keys[userData.lookup]])});var o=Rx.Observable.of(div([div(".nav",{style:"height:120px;"},[div(".nav-wrapper",[div(".logout",{style:{padding:"5px",color:"#cecece",cursor:"pointer"}},[span("Sign Out")]),a(".brand-logo .center","Worth Watchers"),img(".profileImg .center"),label(".name .center"),div(".input-field .col",{style:{display:"none",width:"150px","margin-left":"50%",position:"absolute",transform:"translateX(-50%)",top:"152px"}},[input("#name .validate",{type:"text",style:{"font-size":"16px","text-align":"center"}}),label("Name"),i(".material-icons .update","done")]),i(".material-icons .edit .hide","mode_edit")])]),br(),br(),div(".row .networth-header",{style:{visibility:"hidden","padding-left":"10px"}},[div(".col .s12 .m12 .l12 .navigate",[button(".arrow .left",{style:{display:"inline-block"}},[i(),i()]),div({style:{display:"inline-block",width:"115px","text-align":"center"}},[label(".nav-title","December 2016")]),button(".arrow .right",{style:{display:"inline-block"}},[i(),i()])]),div(".col .s12 .m12 .l12 .assets",[label("Assets: "),span(".green-text","")]),div(".col .s12 .m12 .l12 .debts",[label("Debts: "),span(".red-text","")]),div(".col .s12 .m12 .l12 .networth",[label("Net Worth: "),span(".green-text .text-darken-3","")])]),br(),div(".row",[div(".col .s12 .m12 .l12 .changeGraph",{style:{opacity:"0"}},[button(".netWorthGraph .active .drawn","Net Worth"),button(".assetsGraph","Assets"),button(".debtsGraph","Debts"),div(".coverDiv")]),div(".col .s12 .offset-m1 .m10 .offset-l2 .l8",{style:{"padding-left":"20px"}},[div(".card-panel",{style:{opacity:"0"}},[div("#curve_chart"),div("#curve_chart_assets"),div("#curve_chart_debts")])]),br(),div(".col .s6 .offset-m1 .m5 .offset-l2 .l4",{style:{"padding-left":"20px"}},[div(".card-panel",{style:{opacity:"0"}},[div("#pie_chart1")])]),div(".col .s6 .m5 .l4",[div(".card-panel",{style:{opacity:"0"}},[div("#pie_chart2")])])]),br(),br()]));return{DOM:o}}function mainModule(e){var t=Rx.Observable.of(div([]));return{DOM:t}}function updateView(){$(".arrow").css("display","inline-block"),$("#curve_chart").parent().show(),$(".changeGraph").show(),userData.lookup===userData.keys.length-1&&$(".arrow.right").hide(),0===userData.lookup&&($(".arrow.left").hide(),$("#curve_chart").parent().hide(),$(".changeGraph").hide())}function drawLineGraph(e,t){var a=void 0,r=e||"",i=t||"Net Worth",s=t||"NetWorth",n=userData.keys[userData.lookup],o=[],l=void 0,u=void 0,c=$(document.getElementById("curve_chart"+r)),d=void 0,p=void 0,h=2.2;for(a=0;a<userData.keys.length&&(o.push(userData.keys[a]),userData.keys[a]!==n);a++);if(c.hide(),o.length<=1)return!1;o.length&&(u=o[o.length-1],userData.currentMonth=parseInt(u.substring(4)),userData.currentYear=u.substring(0,4)),d=o.reduce(function(e,t){var a=t.toString(),r=utility.monthMap[parseInt(a.substring(4))],i=a.substring(0,4);return l=r+" "+i,e.push([l,parseFloat(userData.entries[t][s])]),e},[["Month",i]]);var D=google.visualization.arrayToDataTable(d);p=c.parent().width()-5,p<900&&(h=1.5),p<450&&(h=1.2);var m={chart:{title:i+" as of "+l,subtitle:""},width:p,height:p/h},v=new google.charts.Line(c[0]);v.draw(D,m),c.fadeIn("slow").siblings().hide()}function drawPieGraphs(e,t){var a=[],r=document.getElementById("pie_chart1"),i=document.getElementById("pie_chart2"),s=void 0,n=2.2,o=userData.keys[userData.lookup],l=new google.visualization.DataTable;l.addColumn("string","Asset"),l.addColumn("number","Amount"),userData.entries[o]&&userData.entries[o].Asset&&(a=Object.keys(userData.entries[o].Asset).map(function(e){return[e,parseFloat(userData.entries[o].Asset[e])]})),s=$(r).parent().width(),s+=.05*s,s<900&&(n=1.5),s<450&&(n=1.2);var u={title:"Asset Allocation",width:s,height:s/n};if(a.length){l.addRows(a);var c=new google.visualization.PieChart(r);r.hidden=!1,c.draw(l,u)}if(l=new google.visualization.DataTable,l.addColumn("string","Debt"),l.addColumn("number","Amount"),a=[],userData.entries[o]&&userData.entries[o].Debt&&(a=Object.keys(userData.entries[o].Debt).map(function(e){return[e,parseFloat(userData.entries[o].Debt[e])]})),a.length){l.addRows(a),u.title="Debt Allocation";var d=new google.visualization.PieChart(i);i.hidden=!1,d.draw(l,u)}}function populateNetWorthGraph(e){var t=void 0,a="",r="",i=void 0;e&&(updateView(),t=document.getElementsByClassName("networth-header")[0],t.getElementsByClassName("nav-title")[0].textContent=userData.monthString,t.getElementsByClassName("networth")[0].getElementsByTagName("span")[0].textContent="$"+parseFloat(e.NetWorth).toLocaleString(void 0,{maximumFractionDigits:0,minimumFractionDigits:0}),t.getElementsByClassName("assets")[0].getElementsByTagName("span")[0].textContent="$"+parseFloat(e.Assets).toLocaleString(void 0,{maximumFractionDigits:0,minimumFractionDigits:0}),t.getElementsByClassName("debts")[0].getElementsByTagName("span")[0].textContent="$"+parseFloat(e.Debts).toLocaleString(void 0,{maximumFractionDigits:0,minimumFractionDigits:0}),t.style.visibility="",i=$(".changeGraph .active"),"Assets"===i.text()&&(a="_assets",r="Assets"),"Debts"===i.text()&&(a="_debts",r="Debts"),drawLineGraph(a,r),drawPieGraphs(),$(".card-panel, .changeGraph").css("opacity",1))}var userDatabase,userData={},utility=function(e){var t={apiKey:"AIzaSyC7eDuSl0CfhDQ95wEXhaNFNHcT3nlxPGs",authDomain:"networth-8b077.firebaseapp.com",databaseURL:"https://networth-8b077.firebaseio.com",storageBucket:"",messagingSenderId:"441384900863"};firebase.initializeApp(t);var a=void 0,r=void 0,i=void 0;location.href.indexOf("/profile")>=0?google.charts.load("current",{packages:["corechart","line"]}):google.charts.load("current",{packages:["line"]}),google.charts.setOnLoadCallback(function(){console.log("google charts loaded")});var s={monthMap:{1:"January",2:"Feburary",3:"March",4:"April",5:"May",6:"June",7:"July",8:"August",9:"September",10:"October",11:"November",12:"December"},profileEdit:!0,setDatabase:function(e){userDatabase=firebase.database().ref(e)},updateUser:function(){var e={};e.displayName=userData.displayName,userDatabase.update(e)},updateProfile:function(){var e={};userData.displayName||(e.displayName=userData.accountName),e.photoURL=userData.accountURL,userDatabase.update(e)},watchData:function(e){var t=void 0,s=this;a=$(e),r=a.find(".asset").next().find("ul li"),i=a.find(".debt").next().find("ul li"),userDatabase.on("value",function(e){var a=e.val()||{};if(userData.entries=a.entries||{},userData.displayName=a.displayName,userData.photoURL=a.photoURL,!t){userData.presentMonth=userData.currentMonth,userData.presentYear=userData.currentYear,t=!0,s.updateProfile();var n=utility.getDataObj();populateNetWorthValues(n,r,i)}})},watchDataProfile:function(e){var t=void 0;a=$(e),userDatabase.on("value",function(e){var r=e.val()||{};if(userData.entries=r.entries||{},!t){t=!0,userData.displayName=r.displayName,userData.photoURL=r.photoURL,userData.keys=Object.keys(userData.entries),a.find(".profileImg")[0].src=userData.photoURL,a.find(".name").text(userData.displayName);var i=utility.getDateObject();userData.currentMonth=i.month,userData.currentYear=i.year;var s=utility.getDataObjProfile();userData.monthString=utility.getMonthString(),populateNetWorthGraph(s),console.log(a)}})},getMonthString:function(){var e=userData.keys[userData.lookup],t=utility.monthMap[parseInt(e.substring(4))],a=e.substring(0,4);return t+" "+a},getReferenceStr:function(e,t){return e=e<10?"0"+e:e,t+""+e},updateData:function(e){var t={},a=this.getReferenceStr(userData.currentMonth,userData.currentYear),r="entries/"+a,i=void 0;userData.entries[a]||(userData.entries[a]={}),userData.entries[a][e.type]||(userData.entries[a][e.type]={}),userData.entries[a][e.type][e.name]=e.value,i=this.getNetWorth(userData.entries[a]),null!==i.Net?(t[r+"/NetWorth"]=parseFloat(i.Net).toFixed(2),t[r+"/Assets"]=parseFloat(i.Assets).toFixed(2),t[r+"/Debts"]=parseFloat(i.Debts).toFixed(2)):(t[r+"/NetWorth"]=null,t[r+"/Assets"]=null,t[r+"/Debts"]=null),t[r+"/"+e.type+"/"+e.name]=e.value,userDatabase.update(t),utility.populateValues(!0)},getDateObject:function(e){var t=void 0,a={};return e&&(t=new Date(e)),t=t||new Date,a.date=t,a.month=t.getMonth()+1,a.year=t.getFullYear(),a},populateValues:function(e){var t=this.getDataObj();return e&&$(".side-nav li:nth-child(2) .entry-grey").length?(this.updateNetWorthValues(t),drawLineGraph(!0),!1):void populateNetWorthValues(t,r,i)},updateNetWorthValues:function(e){var t=document.getElementsByClassName("networth-header")[0],a=.5;t.getElementsByClassName("networth")[0].getElementsByTagName("span")[0].textContent="$"+parseFloat(e.NetWorth).toLocaleString(void 0,{maximumFractionDigits:0,minimumFractionDigits:0}),t.getElementsByClassName("assets")[0].getElementsByTagName("span")[0].textContent="$"+parseFloat(e.Assets).toLocaleString(void 0,{maximumFractionDigits:0,minimumFractionDigits:0}),t.getElementsByClassName("debts")[0].getElementsByTagName("span")[0].textContent="$"+parseFloat(e.Debts).toLocaleString(void 0,{maximumFractionDigits:0,minimumFractionDigits:0}),t.style.opacity=a},formatEntry:function(e){var t=2;return"Asset"===e.type&&(e.class="green-text",e.prefix="$"),"Debt"===e.type&&(e.class="red-text",e.prefix="$"),"string"==typeof e.value&&(e.value=parseFloat(e.value.replace(/,/g,""))),isNaN(e.value)&&(e.value=0),e.value%1===0&&(t=0),e.display=e.prefix+e.value.toLocaleString(void 0,{maximumFractionDigits:t,minimumFractionDigits:t}),e},getDataObj:function(){var e=this.getReferenceStr(userData.currentMonth,userData.currentYear),t=userData.entries[e],a=void 0,r=void 0;return t&&t.NetWorth?t&&(t.entryGrey=!1):(a=userData.currentMonth-1,r=userData.currentYear,0===a&&(a=12,r-=1),e=this.getReferenceStr(a,r),t=userData.entries[e],t&&(t.entryGrey=!0)),t},getDataObjProfile:function(){var e=this.getReferenceStr(userData.currentMonth,userData.currentYear),t=void 0,a=void 0;for(a=0;a<userData.keys.length;a++)if(userData.keys[a]===e){userData.lookup=a,userData.keys=userData.keys.slice(0,a+1);break}return userData.lookup?t=userData.entries[e]:(userData.lookup=userData.keys.length-1,t=userData.entries[userData.keys[userData.lookup]]),t},getNetWorth:function(e){var t=void 0,a=void 0,r=void 0,i=void 0,s=void 0,n=!1;return e||(e={}),e.Asset||(e.Asset={}),e.Debt||(e.Debt={}),i=Object.keys(e.Asset),s=Object.keys(e.Debt),t=i.reduce(function(t,a){return null!==e.Asset[a]&&(t+=e.Asset[a],n=!0),t},0),a=s.reduce(function(t,a){return null!==e.Debt[a]&&(n=!0,t+=e.Debt[a]),t},0),r=t-a,n?{Net:r,Assets:t,Debts:a}:{Net:null}}};return s}(),_CycleDOM=CycleDOM,label=_CycleDOM.label,input=_CycleDOM.input,hr=_CycleDOM.hr,div=_CycleDOM.div,h1=_CycleDOM.h1,h4=_CycleDOM.h4,a=_CycleDOM.a,span=_CycleDOM.span,makeDOMDriver=_CycleDOM.makeDOMDriver,button=_CycleDOM.button,p=_CycleDOM.p,br=_CycleDOM.br,h2=_CycleDOM.h2,header=_CycleDOM.header,nav=_CycleDOM.nav,ul=_CycleDOM.ul,li=_CycleDOM.li,img=_CycleDOM.img,i=_CycleDOM.i,main=_CycleDOM.main,select=_CycleDOM.select,option=_CycleDOM.option,drivers={DOM:makeDOMDriver("#app")},initApp=function(){var e,t;document;t=location.href.indexOf("user="),t>=0&&(e=location.href.substring(t+5)),firebase.auth().onAuthStateChanged(function(t){e?(utility.setDatabase(e),Cycle.run(page,drivers),t&&t.uid===e||(utility.profileEdit=!1)):t?(utility.setDatabase(t.uid),Cycle.run(page,drivers),history.replaceState("","Net Worth Profile",location.href+"?user="+t.uid)):location.href="/Net-Worth"},function(e){console.log(e)})};window.addEventListener("load",function(){initApp()});
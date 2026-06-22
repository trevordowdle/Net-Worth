
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

    
    
    let obj = {
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
        getAppBasePath:function(){
            var path = location.pathname;
            if (path.length > 1 && path.charAt(path.length - 1) === '/') {
                path = path.slice(0, -1);
            }
            if (path.slice(-8) === '/profile') {
                return path.slice(0, -8) || '';
            }
            return path === '/' ? '' : path;
        },
        appUrl:function(suffix){
            var base = this.getAppBasePath();
            var path = (suffix || '').replace(/^\//, '').replace(/\/$/, '');
            if (!path) {
                return base ? base + '/' : '/';
            }
            // Trailing slash so profile/css/main.css resolves (not /css/main.css)
            return (base ? base + '/' : '/') + path + '/';
        },
        parseMonthUrlParam:function(){
            var params = new URLSearchParams(location.search);
            var raw = params.get('month');
            var month, year;
            if(!raw){
                return null;
            }
            raw = String(raw).trim().replace('-', '');
            if(!/^\d{6}$/.test(raw)){
                return null;
            }
            month = parseInt(raw.substring(4), 10);
            year = parseInt(raw.substring(0, 4), 10);
            if(month < 1 || month > 12){
                return null;
            }
            return {month: month, year: year, ref: raw};
        },
        getInitialCarouselDateString:function(){
            var parsed = this.parseMonthUrlParam();
            if(!parsed){
                return null;
            }
            userData.clearMonthParamWhenNavigating = true;
            return parsed.month + '/01/' + parsed.year;
        },
        clearMonthUrlParamIfNeeded:function(){
            if(!userData.clearMonthParamWhenNavigating){
                return;
            }
            userData.clearMonthParamWhenNavigating = false;
            var params = new URLSearchParams(location.search);
            if(!params.has('month')){
                return;
            }
            params.delete('month');
            var qs = params.toString();
            history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
        },
        assetUrl:function(suffix){
            var base = this.getAppBasePath();
            var path = (suffix || '').replace(/^\//, '');
            if(!path){
                return base ? base + '/' : '/';
            }
            return (base ? base + '/' : '/') + path;
        },
        resolvePhotoURL:function(url){
            var fallback = this.assetUrl('img/anony.jpg');
            var src = url || userData.accountURL;
            if(!src){
                return fallback;
            }
            if(/^https?:\/\//i.test(src) || /^\/\//.test(src)){
                return src;
            }
            if(src.charAt(0) === '/'){
                var base = this.getAppBasePath();
                if(base && src.indexOf(base + '/') !== 0 && src !== base){
                    return base + src;
                }
                return src;
            }
            return this.assetUrl(src);
        },
        applyProfilePhoto:function($container){
            var $img = $container.find('.profileImg');
            if(!$img.length){
                return;
            }
            var el = $img[0];
            var fallback = this.assetUrl('img/anony.jpg');
            el.referrerPolicy = 'no-referrer';
            el.onerror = function(){
                this.onerror = null;
                this.src = fallback;
            };
            el.src = this.resolvePhotoURL(userData.photoURL);
        },
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
               let data = snapshot.val() || {}, i;
               userData.entries = data.entries || {};
            
               userData.tagSeries = data.tagSeries || {};

               if(!firstSnapshot){
                   firstSnapshot = true;
                   userData.profileTagFilter = [];
                   userData.profileTagMatchMode = 'any';
                   userData.displayName = data.displayName;
                   userData.photoURL = data.photoURL;
                   userData.keys = Object.keys(userData.entries);
                   utilityThis.applyProfilePhoto($el);
                   $el.find('.name').text(userData.displayName);
                   let dateObj = utility.getDateObject();
                   userData.currentMonth = dateObj.month;
                   userData.currentYear = dateObj.year;
                   let dataObj = utility.getDataObjProfile();
                   userData.monthString = utility.getMonthString();
                   populateNetWorthGraph(dataObj);
               }

            });
        
        },
        getMonthString(){
            let keyString = userData.keys[userData.lookup],
                month = utility.monthMap[parseInt(keyString.substring(4))],
                year = keyString.substring(0,4);
            return month + " " + year;
        },
        getReferenceStr(month,year){
            month = month < 10 ? '0'+month : month; 
            return year+''+month;
        },
        getCurrentMonthRef:function(){
            return this.getReferenceStr(userData.currentMonth, userData.currentYear);
        },
        getPreviousMonthRef:function(month, year){
            var tempMonth = (month !== undefined ? month : userData.currentMonth) - 1;
            var tempYear = year !== undefined ? year : userData.currentYear;
            if(tempMonth === 0){
                tempMonth = 12;
                tempYear -= 1;
            }
            return this.getReferenceStr(tempMonth, tempYear);
        },
        normalizeTags:function(input){
            var list, seen = {}, out = [], i, t;
            if(!input){
                return [];
            }
            list = Array.isArray(input) ? input : String(input).split(',');
            for(i = 0; i < list.length; i++){
                t = String(list[i]).trim().toLowerCase();
                if(t && !seen[t]){
                    seen[t] = true;
                    out.push(t);
                }
            }
            return out.slice(0, 10);
        },
        tagsToInputValue:function(tags){
            return (tags || []).join(', ');
        },
        getTagsForEntry:function(monthRef, type, name){
            var month = userData.entries[monthRef];
            var tags;
            if(!month || !month.tags || !month.tags[type]){
                return [];
            }
            tags = month.tags[type][name];
            return Array.isArray(tags) ? tags : [];
        },
        getTagsForDisplay:function(type, name, dataObj){
            var currentRef = this.getCurrentMonthRef();
            var currentTags = this.getTagsForEntry(currentRef, type, name);
            if(currentTags.length){
                return currentTags;
            }
            if(dataObj && dataObj.entryGrey){
                return this.getTagsForEntry(this.getPreviousMonthRef(), type, name);
            }
            return [];
        },
        escapeHtml:function(str){
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        },
        formatTagsHtml:function(tags, grey){
            var i, cls, html = '', safe;
            if(!tags || !tags.length){
                return '';
            }
            cls = grey ? 'entry-tag entry-tag-grey' : 'entry-tag';
            html = '<span class="entry-tags">';
            for(i = 0; i < tags.length; i++){
                safe = this.escapeHtml(tags[i]);
                html += '<span class="' + cls + '">' + safe + '</span>';
            }
            html += '</span>';
            return html;
        },
        syncEntryTagsLocal:function(refDate, type, name, tags){
            if(!userData.entries[refDate]){
                userData.entries[refDate] = {};
            }
            if(!userData.entries[refDate].tags){
                userData.entries[refDate].tags = {};
            }
            if(!userData.entries[refDate].tags[type]){
                userData.entries[refDate].tags[type] = {};
            }
            if(tags.length){
                userData.entries[refDate].tags[type][name] = tags;
            }
            else{
                delete userData.entries[refDate].tags[type][name];
            }
        },
        updateData:function(entry){		
             let updateObj = {},		
             refDate = this.getReferenceStr(userData.currentMonth,userData.currentYear),		
             refStr = 'entries/'+refDate,
             tagPath,
             normalizedTags,
             netWorthData;		
             if(!userData.entries[refDate]){		
                 userData.entries[refDate] = {};		
             }		
             if(!userData.entries[refDate][entry.type]){		
                 userData.entries[refDate][entry.type] = {};		
             }
             if(entry.value === null){
                 delete userData.entries[refDate][entry.type][entry.name];
             }
             else{
                 userData.entries[refDate][entry.type][entry.name] = entry.value;
             }
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
             updateObj[refStr+'/'+entry.type+'/'+entry.name] = entry.value;
             tagPath = refStr + '/tags/' + entry.type + '/' + entry.name;
             if(entry.value === null){
                 updateObj[tagPath] = null;
                 this.syncEntryTagsLocal(refDate, entry.type, entry.name, []);
             }
             else if(entry.tags !== undefined){
                 normalizedTags = this.normalizeTags(entry.tags);
                 if(normalizedTags.length){
                     updateObj[tagPath] = normalizedTags;
                 }
                 else{
                     updateObj[tagPath] = null;
                 }
                 this.syncEntryTagsLocal(refDate, entry.type, entry.name, normalizedTags);
             }
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
        populateValues(fromUpdate){		
             let dataObj = this.getDataObj();
             if(fromUpdate && $('.side-nav li:nth-child(2) .entry-grey').length){
                 this.updateNetWorthValues(dataObj);		
                 drawLineGraph(true);	
                 return false;		
             }		
             populateNetWorthValues(dataObj,$assetEl,$debtEl);		
        },
        updateNetWorthValues:function(dataObj){
            let networthHeader = document.getElementsByClassName('networth-header')[0],
            opacity = .5;
            networthHeader.getElementsByClassName('networth')[0].getElementsByTagName('span')[0].textContent = '$' + parseFloat(dataObj.NetWorth).toLocaleString(undefined, {maximumFractionDigits: 0, minimumFractionDigits: 0});
            networthHeader.getElementsByClassName('assets')[0].getElementsByTagName('span')[0].textContent = '$' + parseFloat(dataObj.Assets).toLocaleString(undefined, {maximumFractionDigits: 0, minimumFractionDigits: 0});
            networthHeader.getElementsByClassName('debts')[0].getElementsByTagName('span')[0].textContent = '$' + parseFloat(dataObj.Debts).toLocaleString(undefined, {maximumFractionDigits: 0, minimumFractionDigits: 0});
            networthHeader.style.opacity = opacity;
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
        entryRowHtml(entry) {
            var grey = entry.grey ? ' entry-grey' : '';
            var tags = entry.tags || [];
            var tagsAttr = tags.length ? ' data-tags="' + tags.join(',') + '"' : '';
            var tagsHtml = this.formatTagsHtml(tags, entry.grey);
            return '<a class="entry-row"' + tagsAttr + '>' +
                '<span class="entry-row-main">' +
                '<span class="entry-label' + grey + '">' +
                entry.name + ' - <span class="entry-value ' + entry.class + '" style="font-size:12px;">' + entry.display + '</span></span>' +
                '<i class="material-icons entry-edit" title="Edit entry">mode_edit</i>' +
                '</span>' +
                tagsHtml +
                '</a>';
        },
        getDataObj(){
             let refString = this.getReferenceStr(userData.currentMonth,userData.currentYear);
             let dataObj = userData.entries[refString], tempMonth, tempYear;
             let entryKeys, entryIndex;

             if(!dataObj || !(dataObj.NetWorth)){
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

             entryKeys = Object.keys(userData.entries);
             entryIndex = entryKeys.indexOf(refString);
             if(entryIndex >= 12){
                this.calculateNetworthAvg(entryKeys.slice(entryIndex-12,entryIndex+1),dataObj);
             }
             else if(entryIndex >= 6){
                this.calculateNetworthAvg(entryKeys.slice(entryIndex-6,entryIndex+1),dataObj);
             }
             else if(entryIndex >= 3){
                this.calculateNetworthAvg(entryKeys.slice(entryIndex-3,entryIndex+1),dataObj);
             }
             else if(entryIndex >= 1){
                 this.calculateNetworthAvg(entryKeys.slice(entryIndex-1,entryIndex+1),dataObj);
             }

             return dataObj;
        },  
        calculateNetworthAvg(entries,dataObj){
            let sum = 0, threeMo, sixMo, twelveMo, oneMo, fractionIndicator;
            entries.reverse().map((entry,index)=>{
                let entryData = userData.entries[entry];
                if(index+1 < entries.length){
/*                    if(index === 0){ // Calculate difference 1 month running
                        Object.keys(entryData.Asset).map((key)=>{
                            console.log(key,entryData.Asset[key]-userData.entries[entries[index+1]].Asset[key]);
                        });
                        Object.keys(entryData.Debt).map((key)=>{
                            console.log(key,entryData.Debt[key]-userData.entries[entries[index+1]].Debt[key]);
                        });
                    }*/
                    sum += entryData.NetWorth - userData.entries[entries[index+1]].NetWorth;
                }
                if(index === 0){
                    oneMo = sum;
                    fractionIndicator = this.getFractionIndicator(oneMo);
                    oneMo = oneMo.toLocaleString(undefined, {maximumFractionDigits: fractionIndicator, minimumFractionDigits: fractionIndicator});
                }
                if(index === 2){
                    threeMo = sum/3;
                    fractionIndicator = this.getFractionIndicator(threeMo);
                    threeMo = threeMo.toLocaleString(undefined, {maximumFractionDigits: fractionIndicator, minimumFractionDigits: fractionIndicator});
                }
                if(index === 5){
                    sixMo = sum/6;
                    fractionIndicator = this.getFractionIndicator(sixMo);
                    sixMo = sixMo.toLocaleString(undefined, {maximumFractionDigits: fractionIndicator, minimumFractionDigits: fractionIndicator});
                }
                if(index === 11){
                    twelveMo = sum/12;
                    fractionIndicator = this.getFractionIndicator(twelveMo);
                    twelveMo = twelveMo.toLocaleString(undefined, {maximumFractionDigits: fractionIndicator, minimumFractionDigits: fractionIndicator});
                }
            });
            dataObj.oneMo = oneMo;
            dataObj.threeMo = threeMo;
            dataObj.sixMo = sixMo;
            dataObj.twelveMo = twelveMo;
            //userData
        },
        getFractionIndicator(num){
            return num % 1 === 0 ? 0 : 2;
        },
        getDataObjProfile(){
            let refString = this.getReferenceStr(userData.currentMonth,userData.currentYear),
                dataObj, i;
            
            
            for(i = 0;i < userData.keys.length;i++){
                if(userData.keys[i] === refString){
                    userData.lookup = i;
                    userData.keys = userData.keys.slice(0,i+1);
                    break;
                }
            }

            if(!userData.lookup){
                userData.lookup = userData.keys.length-1;
                dataObj = userData.entries[userData.keys[userData.lookup]];
            }
            else{
                dataObj = userData.entries[refString];
            }
            return dataObj;
        },
        getProfileTagFilter:function(){
            return userData.profileTagFilter || [];
        },
        setProfileTagFilter:function(tags){
            userData.profileTagFilter = this.normalizeTags(tags);
        },
        getProfileTagMatchMode:function(){
            return userData.profileTagMatchMode === 'all' ? 'all' : 'any';
        },
        setProfileTagMatchMode:function(mode){
            userData.profileTagMatchMode = mode === 'all' ? 'all' : 'any';
        },
        getSeriesMatchMode:function(series){
            if(series && series.match === 'any'){
                return 'any';
            }
            if(series && series.match === 'all'){
                return 'all';
            }
            return 'all';
        },
        formatTagFilterSubtitle:function(tags, matchMode){
            var joiner, modeLabel;
            if(!tags || !tags.length){
                return '';
            }
            matchMode = matchMode === 'all' ? 'all' : 'any';
            joiner = matchMode === 'all' ? ' + ' : ' | ';
            modeLabel = matchMode === 'all' ? 'all tags' : 'any tag';
            return 'Tags (' + modeLabel + '): ' + tags.join(joiner);
        },
        getAllTags:function(){
            var tagMap = {}, sorted = [], keys, i, month, types, ti, type, names, ni, name, list, li;
            keys = Object.keys(userData.entries || {});
            types = ['Asset', 'Debt'];
            for(i = 0; i < keys.length; i++){
                month = userData.entries[keys[i]];
                if(!month || !month.tags){
                    continue;
                }
                for(ti = 0; ti < types.length; ti++){
                    type = types[ti];
                    if(!month.tags[type]){
                        continue;
                    }
                    names = Object.keys(month.tags[type]);
                    for(ni = 0; ni < names.length; ni++){
                        list = month.tags[type][names[ni]];
                        if(!Array.isArray(list)){
                            continue;
                        }
                        for(li = 0; li < list.length; li++){
                            tagMap[list[li]] = true;
                        }
                    }
                }
            }
            sorted = Object.keys(tagMap);
            sorted.sort();
            return sorted;
        },
        entryMatchesTags:function(monthRef, type, name, filterTags, matchMode){
            var entryTags, i;
            if(!filterTags || !filterTags.length){
                return true;
            }
            entryTags = this.getTagsForEntry(monthRef, type, name);
            matchMode = matchMode === 'all' ? 'all' : 'any';
            if(matchMode === 'any'){
                for(i = 0; i < filterTags.length; i++){
                    if(entryTags.indexOf(filterTags[i]) >= 0){
                        return true;
                    }
                }
                return false;
            }
            for(i = 0; i < filterTags.length; i++){
                if(entryTags.indexOf(filterTags[i]) < 0){
                    return false;
                }
            }
            return true;
        },
        sumTaggedEntries:function(monthRef, filterTags, matchMode){
            var month = userData.entries[monthRef], types = ['Asset', 'Debt'], assets = 0, debts = 0,
                matches = [], ti, type, keys, ki, name, val, nw;
            if(!month){
                return {assets: 0, debts: 0, net: 0, matches: [], filtered: false};
            }
            if(!filterTags || !filterTags.length){
                nw = this.getNetWorth(month);
                if(nw.Net === null){
                    return {assets: 0, debts: 0, net: 0, matches: [], filtered: false};
                }
                return {
                    assets: nw.Assets,
                    debts: nw.Debts,
                    net: nw.Net,
                    matches: [],
                    filtered: false
                };
            }
            for(ti = 0; ti < types.length; ti++){
                type = types[ti];
                if(!month[type]){
                    continue;
                }
                keys = Object.keys(month[type]);
                for(ki = 0; ki < keys.length; ki++){
                    name = keys[ki];
                    val = month[type][name];
                    if(val === null || val === undefined){
                        continue;
                    }
                    if(!this.entryMatchesTags(monthRef, type, name, filterTags, matchMode)){
                        continue;
                    }
                    val = parseFloat(val);
                    if(type === 'Asset'){
                        assets += val;
                    }
                    else{
                        debts += val;
                    }
                    matches.push({
                        type: type,
                        name: name,
                        value: val,
                        tags: this.getTagsForEntry(monthRef, type, name)
                    });
                }
            }
            return {assets: assets, debts: debts, net: assets - debts, matches: matches, filtered: true};
        },
        getFilteredLineValue:function(monthRef, graphMode, filterTags, matchMode){
            var sum = this.sumTaggedEntries(monthRef, filterTags, matchMode || this.getProfileTagMatchMode());
            if(!sum.filtered){
                var month = userData.entries[monthRef];
                if(!month){
                    return null;
                }
                if(graphMode === 'assets'){
                    return month.Assets != null ? parseFloat(month.Assets) : null;
                }
                if(graphMode === 'debts'){
                    return month.Debts != null ? parseFloat(month.Debts) : null;
                }
                return month.NetWorth != null ? parseFloat(month.NetWorth) : null;
            }
            if(graphMode === 'assets'){
                return sum.assets;
            }
            if(graphMode === 'debts'){
                return sum.debts;
            }
            return sum.net;
        },
        getTagSeriesList:function(){
            var raw = userData.tagSeries || {}, list = [], id;
            for(id in raw){
                if(!raw.hasOwnProperty(id)){
                    continue;
                }
                list.push({
                    id: id,
                    label: raw[id].label || id,
                    tags: this.normalizeTags(raw[id].tags || []),
                    negate: !!raw[id].negate,
                    match: raw[id].match === 'any' ? 'any' : 'all'
                });
            }
            list.sort(function(a, b){
                return a.label.localeCompare(b.label);
            });
            return list;
        },
        seriesTagsKey:function(tags, matchMode){
            var match = matchMode === 'all' ? 'all' : 'any';
            return match + '::' + this.normalizeTags(tags).slice().sort().join('|');
        },
        findTagSeriesByTags:function(tags, matchMode){
            var key = this.seriesTagsKey(tags, matchMode), list = this.getTagSeriesList(), i;
            for(i = 0; i < list.length; i++){
                if(this.seriesTagsKey(list[i].tags, list[i].match) === key){
                    return list[i];
                }
            }
            return null;
        },
        saveTagSeries:function(label, tags, negate, matchMode){
            var normalized = this.normalizeTags(tags), ref, id, payload, match;
            if(!label || !normalized.length){
                return null;
            }
            if(this.getTagSeriesList().length >= 5){
                return null;
            }
            match = matchMode === 'all' ? 'all' : 'any';
            if(this.findTagSeriesByTags(normalized, match)){
                return null;
            }
            payload = {label: label, tags: normalized, negate: !!negate, match: match};
            ref = userDatabase.child('tagSeries').push();
            id = ref.key;
            ref.set(payload);
            if(!userData.tagSeries){
                userData.tagSeries = {};
            }
            userData.tagSeries[id] = payload;
            return id;
        },
        setTagSeriesNegate:function(id, negate){
            if(!userData.tagSeries || !userData.tagSeries[id]){
                return;
            }
            userData.tagSeries[id].negate = !!negate;
            userDatabase.child('tagSeries/' + id + '/negate').set(!!negate);
        },
        removeTagSeries:function(id){
            userDatabase.child('tagSeries/' + id).remove();
            if(userData.tagSeries){
                delete userData.tagSeries[id];
            }
        },
        monthHasTaggedSeriesData:function(monthRef, series){
            return this.sumTaggedEntries(monthRef, series.tags, this.getSeriesMatchMode(series)).matches.length > 0;
        },
        getSeriesChartMonthKeys:function(seriesList, endMonthKey){
            var keys = [], relevant = [], i, ki, monthKey, si;
            if(!seriesList || !seriesList.length){
                return [];
            }
            for(i = 0; i < userData.keys.length; i++){
                keys.push(userData.keys[i]);
                if(userData.keys[i] === endMonthKey){
                    break;
                }
            }
            for(ki = 0; ki < keys.length; ki++){
                monthKey = keys[ki].toString();
                for(si = 0; si < seriesList.length; si++){
                    if(this.monthHasTaggedSeriesData(monthKey, seriesList[si])){
                        relevant.push(monthKey);
                        break;
                    }
                }
            }
            return relevant;
        },
        getSeriesLineValue:function(monthKey, graphMode, series){
            var sum, val;
            sum = this.sumTaggedEntries(monthKey, series.tags, this.getSeriesMatchMode(series));
            if(!sum.matches.length){
                return null;
            }
            if(graphMode === 'assets'){
                val = sum.assets;
            }
            else if(graphMode === 'debts'){
                val = sum.debts;
            }
            else{
                val = sum.net;
            }
            if(series.negate){
                val = -val;
            }
            return val;
        },
        defaultSeriesLabelForTags:function(tags, matchMode){
            var normalized = this.normalizeTags(tags);
            if(!normalized.length){
                return '';
            }
            return matchMode === 'all' ? normalized.join(' + ') : normalized.join(' | ');
        },
        buildSeriesChartRows:function(seriesList, graphMode, endMonthKey){
            var keys, ki, header, rows, monthKey, monthLabel, row, si, val;
            if(!seriesList || !seriesList.length){
                return null;
            }
            keys = this.getSeriesChartMonthKeys(seriesList, endMonthKey);
            if(keys.length <= 1){
                return null;
            }
            header = ['Month'];
            for(si = 0; si < seriesList.length; si++){
                header.push(seriesList[si].label + (seriesList[si].negate ? ' (sign flipped)' : ''));
            }
            rows = [header];
            for(ki = 0; ki < keys.length; ki++){
                monthKey = keys[ki].toString();
                monthLabel = this.monthMap[parseInt(monthKey.substring(4), 10)] + ' ' + monthKey.substring(0, 4);
                row = [monthLabel];
                for(si = 0; si < seriesList.length; si++){
                    val = this.getSeriesLineValue(monthKey, graphMode, seriesList[si]);
                    row.push(val === null ? null : val);
                }
                rows.push(row);
            }
            return {rows: rows, monthCount: keys.length};
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
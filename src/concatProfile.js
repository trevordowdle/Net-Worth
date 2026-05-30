"use strict";

var userDatabase,
  userData = {}; // get user database

var utility = function (profile) {
  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyC7eDuSl0CfhDQ95wEXhaNFNHcT3nlxPGs",
    authDomain: "networth-8b077.firebaseapp.com",
    databaseURL: "https://networth-8b077.firebaseio.com",
    storageBucket: "",
    messagingSenderId: "441384900863"
  };
  firebase.initializeApp(config);
  var $el, $assetEl, $debtEl;
  if (location.href.indexOf('/profile') >= 0) {
    google.charts.load('current', {
      'packages': ['corechart', 'line']
    });
  } else {
    google.charts.load('current', {
      'packages': [/*'corechart',*/'line']
    });
  }
  google.charts.setOnLoadCallback(function () {
    //either use promises or somehow use rxjs to combine the data and the chart callback for when both are ready.
    console.log('google charts loaded');
  });
  var obj = {
    monthMap: {
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
    profileEdit: true,
    getAppBasePath: function getAppBasePath() {
      var path = location.pathname;
      if (path.length > 1 && path.charAt(path.length - 1) === '/') {
        path = path.slice(0, -1);
      }
      if (path.slice(-8) === '/profile') {
        return path.slice(0, -8) || '';
      }
      return path === '/' ? '' : path;
    },
    appUrl: function appUrl(suffix) {
      var base = this.getAppBasePath();
      var path = (suffix || '').replace(/^\//, '').replace(/\/$/, '');
      if (!path) {
        return base ? base + '/' : '/';
      }
      // Trailing slash so profile/css/main.css resolves (not /css/main.css)
      return (base ? base + '/' : '/') + path + '/';
    },
    parseMonthUrlParam: function parseMonthUrlParam() {
      var params = new URLSearchParams(location.search);
      var raw = params.get('month');
      var month, year;
      if (!raw) {
        return null;
      }
      raw = String(raw).trim().replace('-', '');
      if (!/^\d{6}$/.test(raw)) {
        return null;
      }
      month = parseInt(raw.substring(4), 10);
      year = parseInt(raw.substring(0, 4), 10);
      if (month < 1 || month > 12) {
        return null;
      }
      return {
        month: month,
        year: year,
        ref: raw
      };
    },
    getInitialCarouselDateString: function getInitialCarouselDateString() {
      var parsed = this.parseMonthUrlParam();
      if (!parsed) {
        return null;
      }
      userData.clearMonthParamWhenNavigating = true;
      return parsed.month + '/01/' + parsed.year;
    },
    clearMonthUrlParamIfNeeded: function clearMonthUrlParamIfNeeded() {
      if (!userData.clearMonthParamWhenNavigating) {
        return;
      }
      userData.clearMonthParamWhenNavigating = false;
      var params = new URLSearchParams(location.search);
      if (!params.has('month')) {
        return;
      }
      params["delete"]('month');
      var qs = params.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    },
    assetUrl: function assetUrl(suffix) {
      var base = this.getAppBasePath();
      var path = (suffix || '').replace(/^\//, '');
      if (!path) {
        return base ? base + '/' : '/';
      }
      return (base ? base + '/' : '/') + path;
    },
    resolvePhotoURL: function resolvePhotoURL(url) {
      var fallback = this.assetUrl('img/anony.jpg');
      var src = url || userData.accountURL;
      if (!src) {
        return fallback;
      }
      if (/^https?:\/\//i.test(src) || /^\/\//.test(src)) {
        return src;
      }
      if (src.charAt(0) === '/') {
        var base = this.getAppBasePath();
        if (base && src.indexOf(base + '/') !== 0 && src !== base) {
          return base + src;
        }
        return src;
      }
      return this.assetUrl(src);
    },
    applyProfilePhoto: function applyProfilePhoto($container) {
      var $img = $container.find('.profileImg');
      if (!$img.length) {
        return;
      }
      var el = $img[0];
      var fallback = this.assetUrl('img/anony.jpg');
      el.referrerPolicy = 'no-referrer';
      el.onerror = function () {
        this.onerror = null;
        this.src = fallback;
      };
      el.src = this.resolvePhotoURL(userData.photoURL);
    },
    setDatabase: function setDatabase(uid) {
      userDatabase = firebase.database().ref(uid);
    },
    updateUser: function updateUser() {
      var updateObj = {};
      updateObj.displayName = userData.displayName;
      userDatabase.update(updateObj);
    },
    updateProfile: function updateProfile() {
      var updateObj = {};
      if (!userData.displayName) {
        updateObj.displayName = userData.accountName;
      }
      updateObj.photoURL = userData.accountURL;
      userDatabase.update(updateObj);
    },
    watchData: function watchData(el) {
      var firstSnapshot,
        utilityThis = this;
      $el = $(el);
      $assetEl = $el.find('.asset').next().find('ul li');
      $debtEl = $el.find('.debt').next().find('ul li');
      userDatabase.on("value", function (snapshot) {
        var data = snapshot.val() || {};
        userData.entries = data.entries || {};
        userData.displayName = data.displayName;
        userData.photoURL = data.photoURL;
        if (!firstSnapshot) {
          userData.presentMonth = userData.currentMonth;
          userData.presentYear = userData.currentYear;
          firstSnapshot = true;
          utilityThis.updateProfile();
          var dataObj = utility.getDataObj();
          populateNetWorthValues(dataObj, $assetEl, $debtEl);
        }
      });
    },
    watchDataProfile: function watchDataProfile(el) {
      var firstSnapshot,
        utilityThis = this;
      $el = $(el);
      userDatabase.on("value", function (snapshot) {
        var data = snapshot.val() || {},
          i;
        userData.entries = data.entries || {};
        userData.tagSeries = data.tagSeries || {};
        if (!firstSnapshot) {
          firstSnapshot = true;
          userData.profileTagFilter = [];
          userData.profileTagMatchMode = 'any';
          userData.displayName = data.displayName;
          userData.photoURL = data.photoURL;
          userData.keys = Object.keys(userData.entries);
          utilityThis.applyProfilePhoto($el);
          $el.find('.name').text(userData.displayName);
          var dateObj = utility.getDateObject();
          userData.currentMonth = dateObj.month;
          userData.currentYear = dateObj.year;
          var dataObj = utility.getDataObjProfile();
          userData.monthString = utility.getMonthString();
          populateNetWorthGraph(dataObj);
        }
      });
    },
    getMonthString: function getMonthString() {
      var keyString = userData.keys[userData.lookup],
        month = utility.monthMap[parseInt(keyString.substring(4))],
        year = keyString.substring(0, 4);
      return month + " " + year;
    },
    getReferenceStr: function getReferenceStr(month, year) {
      month = month < 10 ? '0' + month : month;
      return year + '' + month;
    },
    getCurrentMonthRef: function getCurrentMonthRef() {
      return this.getReferenceStr(userData.currentMonth, userData.currentYear);
    },
    getPreviousMonthRef: function getPreviousMonthRef(month, year) {
      var tempMonth = (month !== undefined ? month : userData.currentMonth) - 1;
      var tempYear = year !== undefined ? year : userData.currentYear;
      if (tempMonth === 0) {
        tempMonth = 12;
        tempYear -= 1;
      }
      return this.getReferenceStr(tempMonth, tempYear);
    },
    normalizeTags: function normalizeTags(input) {
      var list,
        seen = {},
        out = [],
        i,
        t;
      if (!input) {
        return [];
      }
      list = Array.isArray(input) ? input : String(input).split(',');
      for (i = 0; i < list.length; i++) {
        t = String(list[i]).trim().toLowerCase();
        if (t && !seen[t]) {
          seen[t] = true;
          out.push(t);
        }
      }
      return out.slice(0, 10);
    },
    tagsToInputValue: function tagsToInputValue(tags) {
      return (tags || []).join(', ');
    },
    getTagsForEntry: function getTagsForEntry(monthRef, type, name) {
      var month = userData.entries[monthRef];
      var tags;
      if (!month || !month.tags || !month.tags[type]) {
        return [];
      }
      tags = month.tags[type][name];
      return Array.isArray(tags) ? tags : [];
    },
    getTagsForDisplay: function getTagsForDisplay(type, name, dataObj) {
      var currentRef = this.getCurrentMonthRef();
      var currentTags = this.getTagsForEntry(currentRef, type, name);
      if (currentTags.length) {
        return currentTags;
      }
      if (dataObj && dataObj.entryGrey) {
        return this.getTagsForEntry(this.getPreviousMonthRef(), type, name);
      }
      return [];
    },
    escapeHtml: function escapeHtml(str) {
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },
    formatTagsHtml: function formatTagsHtml(tags, grey) {
      var i,
        cls,
        html = '',
        safe;
      if (!tags || !tags.length) {
        return '';
      }
      cls = grey ? 'entry-tag entry-tag-grey' : 'entry-tag';
      html = '<span class="entry-tags">';
      for (i = 0; i < tags.length; i++) {
        safe = this.escapeHtml(tags[i]);
        html += '<span class="' + cls + '">' + safe + '</span>';
      }
      html += '</span>';
      return html;
    },
    syncEntryTagsLocal: function syncEntryTagsLocal(refDate, type, name, tags) {
      if (!userData.entries[refDate]) {
        userData.entries[refDate] = {};
      }
      if (!userData.entries[refDate].tags) {
        userData.entries[refDate].tags = {};
      }
      if (!userData.entries[refDate].tags[type]) {
        userData.entries[refDate].tags[type] = {};
      }
      if (tags.length) {
        userData.entries[refDate].tags[type][name] = tags;
      } else {
        delete userData.entries[refDate].tags[type][name];
      }
    },
    updateData: function updateData(entry) {
      var updateObj = {},
        refDate = this.getReferenceStr(userData.currentMonth, userData.currentYear),
        refStr = 'entries/' + refDate,
        tagPath,
        normalizedTags,
        netWorthData;
      if (!userData.entries[refDate]) {
        userData.entries[refDate] = {};
      }
      if (!userData.entries[refDate][entry.type]) {
        userData.entries[refDate][entry.type] = {};
      }
      if (entry.value === null) {
        userData.entries[refDate][entry.type][entry.name] = null;
      } else {
        userData.entries[refDate][entry.type][entry.name] = entry.value;
      }
      netWorthData = this.getNetWorth(userData.entries[refDate]);
      if (netWorthData.Net !== null) {
        updateObj[refStr + '/NetWorth'] = parseFloat(netWorthData.Net).toFixed(2);
        updateObj[refStr + '/Assets'] = parseFloat(netWorthData.Assets).toFixed(2);
        updateObj[refStr + '/Debts'] = parseFloat(netWorthData.Debts).toFixed(2);
      } else {
        updateObj[refStr + '/NetWorth'] = null;
        updateObj[refStr + '/Assets'] = null;
        updateObj[refStr + '/Debts'] = null;
      }
      updateObj[refStr + '/' + entry.type + '/' + entry.name] = entry.value;
      tagPath = refStr + '/tags/' + entry.type + '/' + entry.name;
      if (entry.value === null) {
        updateObj[tagPath] = null;
        this.syncEntryTagsLocal(refDate, entry.type, entry.name, []);
      } else if (entry.tags !== undefined) {
        normalizedTags = this.normalizeTags(entry.tags);
        if (normalizedTags.length) {
          updateObj[tagPath] = normalizedTags;
        } else {
          updateObj[tagPath] = null;
        }
        this.syncEntryTagsLocal(refDate, entry.type, entry.name, normalizedTags);
      }
      userDatabase.update(updateObj);
      utility.populateValues(true);
    },
    getDateObject: function getDateObject(dateString) {
      var date,
        dateObject = {};
      if (dateString) {
        date = new Date(dateString);
      }
      date = date || new Date();
      dateObject.date = date;
      dateObject.month = date.getMonth() + 1;
      dateObject.year = date.getFullYear();
      return dateObject;
    },
    populateValues: function populateValues(fromUpdate) {
      var dataObj = this.getDataObj();
      if (fromUpdate && $('.side-nav li:nth-child(2) .entry-grey').length) {
        if (!dataObj.entryGrey) {
          populateNetWorthValues(dataObj, $assetEl, $debtEl);
          return;
        }
        this.updateNetWorthValues(dataObj);
        drawLineGraph(true);
        return false;
      }
      populateNetWorthValues(dataObj, $assetEl, $debtEl);
    },
    updateNetWorthValues: function updateNetWorthValues(dataObj) {
      var networthHeader = document.getElementsByClassName('networth-header')[0],
        opacity = .5;
      networthHeader.getElementsByClassName('networth')[0].getElementsByTagName('span')[0].textContent = '$' + parseFloat(dataObj.NetWorth).toLocaleString(undefined, {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
      });
      networthHeader.getElementsByClassName('assets')[0].getElementsByTagName('span')[0].textContent = '$' + parseFloat(dataObj.Assets).toLocaleString(undefined, {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
      });
      networthHeader.getElementsByClassName('debts')[0].getElementsByTagName('span')[0].textContent = '$' + parseFloat(dataObj.Debts).toLocaleString(undefined, {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
      });
      networthHeader.style.opacity = opacity;
    },
    formatEntry: function formatEntry(entry) {
      var fractionIndicator = 2;
      if (entry.type === "Asset") {
        entry["class"] = "green-text";
        entry.prefix = '$';
      }
      if (entry.type === "Debt") {
        entry["class"] = "red-text";
        entry.prefix = '$';
      }
      if (typeof entry.value === "string") {
        entry.value = parseFloat(entry.value.replace(/,/g, ''));
      }
      if (isNaN(entry.value)) {
        entry.value = 0;
      }

      //entry.value = Math.abs(entry.value);
      if (entry.value % 1 === 0) {
        fractionIndicator = 0;
      }
      entry.display = entry.prefix + entry.value.toLocaleString(undefined, {
        maximumFractionDigits: fractionIndicator,
        minimumFractionDigits: fractionIndicator
      });
      return entry;
    },
    entryRowHtml: function entryRowHtml(entry) {
      var grey = entry.grey ? ' entry-grey' : '';
      var tags = entry.tags || [];
      var tagsAttr = tags.length ? ' data-tags="' + tags.join(',') + '"' : '';
      var tagsHtml = this.formatTagsHtml(tags, entry.grey);
      return '<a class="entry-row"' + tagsAttr + '>' + '<span class="entry-row-main">' + '<span class="entry-label' + grey + '">' + entry.name + ' - <span class="entry-value ' + entry["class"] + '" style="font-size:12px;">' + entry.display + '</span></span>' + '<i class="material-icons entry-edit" title="Edit entry">mode_edit</i>' + '</span>' + tagsHtml + '</a>';
    },
    getDataObj: function getDataObj() {
      var refString = this.getReferenceStr(userData.currentMonth, userData.currentYear);
      var dataObj = userData.entries[refString],
        tempMonth,
        tempYear;
      var entryKeys, entryIndex;
      if (!dataObj || !dataObj.NetWorth) {
        tempMonth = userData.currentMonth - 1;
        tempYear = userData.currentYear;
        if (tempMonth === 0) {
          tempMonth = 12;
          tempYear -= 1;
        }
        refString = this.getReferenceStr(tempMonth, tempYear);
        dataObj = userData.entries[refString];
        if (dataObj) {
          dataObj.entryGrey = true;
        }
      } else if (dataObj) {
        dataObj.entryGrey = false;
      }
      entryKeys = Object.keys(userData.entries);
      entryIndex = entryKeys.indexOf(refString);
      if (entryIndex >= 6) {
        //calculate 6 mo average
        this.calculateNetworthAvg(entryKeys.slice(entryIndex - 6, entryIndex + 1), dataObj);
      } else if (entryIndex >= 3) {
        //calculate 3 mo average
        this.calculateNetworthAvg(entryKeys.slice(entryIndex - 3, entryIndex + 1), dataObj);
      } else if (entryIndex >= 1) {
        this.calculateNetworthAvg(entryKeys.slice(entryIndex - 1, entryIndex + 1), dataObj);
      }
      return dataObj;
    },
    calculateNetworthAvg: function calculateNetworthAvg(entries, dataObj) {
      var _this = this;
      var sum = 0,
        threeMo,
        sixMo,
        oneMo,
        fractionIndicator;
      entries.reverse().map(function (entry, index) {
        var entryData = userData.entries[entry];
        if (index + 1 < entries.length) {
          /*                    if(index === 0){ // Calculate difference 1 month running
                                  Object.keys(entryData.Asset).map((key)=>{
                                      console.log(key,entryData.Asset[key]-userData.entries[entries[index+1]].Asset[key]);
                                  });
                                  Object.keys(entryData.Debt).map((key)=>{
                                      console.log(key,entryData.Debt[key]-userData.entries[entries[index+1]].Debt[key]);
                                  });
                              }*/
          sum += entryData.NetWorth - userData.entries[entries[index + 1]].NetWorth;
        }
        if (index === 0) {
          oneMo = sum;
          fractionIndicator = _this.getFractionIndicator(oneMo);
          oneMo = oneMo.toLocaleString(undefined, {
            maximumFractionDigits: fractionIndicator,
            minimumFractionDigits: fractionIndicator
          });
        }
        if (index === 2) {
          threeMo = sum / 3;
          fractionIndicator = _this.getFractionIndicator(threeMo);
          threeMo = threeMo.toLocaleString(undefined, {
            maximumFractionDigits: fractionIndicator,
            minimumFractionDigits: fractionIndicator
          });
        }
        if (index === 5) {
          sixMo = sum / 6;
          fractionIndicator = _this.getFractionIndicator(sixMo);
          sixMo = sixMo.toLocaleString(undefined, {
            maximumFractionDigits: fractionIndicator,
            minimumFractionDigits: fractionIndicator
          });
        }
      });
      dataObj.oneMo = oneMo;
      dataObj.threeMo = threeMo;
      dataObj.sixMo = sixMo;
      //userData
    },
    getFractionIndicator: function getFractionIndicator(num) {
      return num % 1 === 0 ? 0 : 2;
    },
    getDataObjProfile: function getDataObjProfile() {
      var refString = this.getReferenceStr(userData.currentMonth, userData.currentYear),
        dataObj,
        i;
      for (i = 0; i < userData.keys.length; i++) {
        if (userData.keys[i] === refString) {
          userData.lookup = i;
          userData.keys = userData.keys.slice(0, i + 1);
          break;
        }
      }
      if (!userData.lookup) {
        userData.lookup = userData.keys.length - 1;
        dataObj = userData.entries[userData.keys[userData.lookup]];
      } else {
        dataObj = userData.entries[refString];
      }
      return dataObj;
    },
    getProfileTagFilter: function getProfileTagFilter() {
      return userData.profileTagFilter || [];
    },
    setProfileTagFilter: function setProfileTagFilter(tags) {
      userData.profileTagFilter = this.normalizeTags(tags);
    },
    getProfileTagMatchMode: function getProfileTagMatchMode() {
      return userData.profileTagMatchMode === 'all' ? 'all' : 'any';
    },
    setProfileTagMatchMode: function setProfileTagMatchMode(mode) {
      userData.profileTagMatchMode = mode === 'all' ? 'all' : 'any';
    },
    getSeriesMatchMode: function getSeriesMatchMode(series) {
      if (series && series.match === 'any') {
        return 'any';
      }
      if (series && series.match === 'all') {
        return 'all';
      }
      return 'all';
    },
    formatTagFilterSubtitle: function formatTagFilterSubtitle(tags, matchMode) {
      var joiner, modeLabel;
      if (!tags || !tags.length) {
        return '';
      }
      matchMode = matchMode === 'all' ? 'all' : 'any';
      joiner = matchMode === 'all' ? ' + ' : ' | ';
      modeLabel = matchMode === 'all' ? 'all tags' : 'any tag';
      return 'Tags (' + modeLabel + '): ' + tags.join(joiner);
    },
    getAllTags: function getAllTags() {
      var tagMap = {},
        sorted = [],
        keys,
        i,
        month,
        types,
        ti,
        type,
        names,
        ni,
        name,
        list,
        li;
      keys = Object.keys(userData.entries || {});
      types = ['Asset', 'Debt'];
      for (i = 0; i < keys.length; i++) {
        month = userData.entries[keys[i]];
        if (!month || !month.tags) {
          continue;
        }
        for (ti = 0; ti < types.length; ti++) {
          type = types[ti];
          if (!month.tags[type]) {
            continue;
          }
          names = Object.keys(month.tags[type]);
          for (ni = 0; ni < names.length; ni++) {
            list = month.tags[type][names[ni]];
            if (!Array.isArray(list)) {
              continue;
            }
            for (li = 0; li < list.length; li++) {
              tagMap[list[li]] = true;
            }
          }
        }
      }
      sorted = Object.keys(tagMap);
      sorted.sort();
      return sorted;
    },
    entryMatchesTags: function entryMatchesTags(monthRef, type, name, filterTags, matchMode) {
      var entryTags, i;
      if (!filterTags || !filterTags.length) {
        return true;
      }
      entryTags = this.getTagsForEntry(monthRef, type, name);
      matchMode = matchMode === 'all' ? 'all' : 'any';
      if (matchMode === 'any') {
        for (i = 0; i < filterTags.length; i++) {
          if (entryTags.indexOf(filterTags[i]) >= 0) {
            return true;
          }
        }
        return false;
      }
      for (i = 0; i < filterTags.length; i++) {
        if (entryTags.indexOf(filterTags[i]) < 0) {
          return false;
        }
      }
      return true;
    },
    sumTaggedEntries: function sumTaggedEntries(monthRef, filterTags, matchMode) {
      var month = userData.entries[monthRef],
        types = ['Asset', 'Debt'],
        assets = 0,
        debts = 0,
        matches = [],
        ti,
        type,
        keys,
        ki,
        name,
        val,
        nw;
      if (!month) {
        return {
          assets: 0,
          debts: 0,
          net: 0,
          matches: [],
          filtered: false
        };
      }
      if (!filterTags || !filterTags.length) {
        nw = this.getNetWorth(month);
        if (nw.Net === null) {
          return {
            assets: 0,
            debts: 0,
            net: 0,
            matches: [],
            filtered: false
          };
        }
        return {
          assets: nw.Assets,
          debts: nw.Debts,
          net: nw.Net,
          matches: [],
          filtered: false
        };
      }
      for (ti = 0; ti < types.length; ti++) {
        type = types[ti];
        if (!month[type]) {
          continue;
        }
        keys = Object.keys(month[type]);
        for (ki = 0; ki < keys.length; ki++) {
          name = keys[ki];
          val = month[type][name];
          if (val === null || val === undefined) {
            continue;
          }
          if (!this.entryMatchesTags(monthRef, type, name, filterTags, matchMode)) {
            continue;
          }
          val = parseFloat(val);
          if (type === 'Asset') {
            assets += val;
          } else {
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
      return {
        assets: assets,
        debts: debts,
        net: assets - debts,
        matches: matches,
        filtered: true
      };
    },
    getFilteredLineValue: function getFilteredLineValue(monthRef, graphMode, filterTags, matchMode) {
      var sum = this.sumTaggedEntries(monthRef, filterTags, matchMode || this.getProfileTagMatchMode());
      if (!sum.filtered) {
        var month = userData.entries[monthRef];
        if (!month) {
          return null;
        }
        if (graphMode === 'assets') {
          return month.Assets != null ? parseFloat(month.Assets) : null;
        }
        if (graphMode === 'debts') {
          return month.Debts != null ? parseFloat(month.Debts) : null;
        }
        return month.NetWorth != null ? parseFloat(month.NetWorth) : null;
      }
      if (graphMode === 'assets') {
        return sum.assets;
      }
      if (graphMode === 'debts') {
        return sum.debts;
      }
      return sum.net;
    },
    getTagSeriesList: function getTagSeriesList() {
      var raw = userData.tagSeries || {},
        list = [],
        id;
      for (id in raw) {
        if (!raw.hasOwnProperty(id)) {
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
      list.sort(function (a, b) {
        return a.label.localeCompare(b.label);
      });
      return list;
    },
    seriesTagsKey: function seriesTagsKey(tags, matchMode) {
      var match = matchMode === 'all' ? 'all' : 'any';
      return match + '::' + this.normalizeTags(tags).slice().sort().join('|');
    },
    findTagSeriesByTags: function findTagSeriesByTags(tags, matchMode) {
      var key = this.seriesTagsKey(tags, matchMode),
        list = this.getTagSeriesList(),
        i;
      for (i = 0; i < list.length; i++) {
        if (this.seriesTagsKey(list[i].tags, list[i].match) === key) {
          return list[i];
        }
      }
      return null;
    },
    saveTagSeries: function saveTagSeries(label, tags, negate, matchMode) {
      var normalized = this.normalizeTags(tags),
        ref,
        id,
        payload,
        match;
      if (!label || !normalized.length) {
        return null;
      }
      if (this.getTagSeriesList().length >= 5) {
        return null;
      }
      match = matchMode === 'all' ? 'all' : 'any';
      if (this.findTagSeriesByTags(normalized, match)) {
        return null;
      }
      payload = {
        label: label,
        tags: normalized,
        negate: !!negate,
        match: match
      };
      ref = userDatabase.child('tagSeries').push();
      id = ref.key;
      ref.set(payload);
      if (!userData.tagSeries) {
        userData.tagSeries = {};
      }
      userData.tagSeries[id] = payload;
      return id;
    },
    setTagSeriesNegate: function setTagSeriesNegate(id, negate) {
      if (!userData.tagSeries || !userData.tagSeries[id]) {
        return;
      }
      userData.tagSeries[id].negate = !!negate;
      userDatabase.child('tagSeries/' + id + '/negate').set(!!negate);
    },
    removeTagSeries: function removeTagSeries(id) {
      userDatabase.child('tagSeries/' + id).remove();
      if (userData.tagSeries) {
        delete userData.tagSeries[id];
      }
    },
    monthHasTaggedSeriesData: function monthHasTaggedSeriesData(monthRef, series) {
      return this.sumTaggedEntries(monthRef, series.tags, this.getSeriesMatchMode(series)).matches.length > 0;
    },
    getSeriesChartMonthKeys: function getSeriesChartMonthKeys(seriesList, endMonthKey) {
      var keys = [],
        relevant = [],
        i,
        ki,
        monthKey,
        si;
      if (!seriesList || !seriesList.length) {
        return [];
      }
      for (i = 0; i < userData.keys.length; i++) {
        keys.push(userData.keys[i]);
        if (userData.keys[i] === endMonthKey) {
          break;
        }
      }
      for (ki = 0; ki < keys.length; ki++) {
        monthKey = keys[ki].toString();
        for (si = 0; si < seriesList.length; si++) {
          if (this.monthHasTaggedSeriesData(monthKey, seriesList[si])) {
            relevant.push(monthKey);
            break;
          }
        }
      }
      return relevant;
    },
    getSeriesLineValue: function getSeriesLineValue(monthKey, graphMode, series) {
      var sum, val;
      sum = this.sumTaggedEntries(monthKey, series.tags, this.getSeriesMatchMode(series));
      if (!sum.matches.length) {
        return null;
      }
      if (graphMode === 'assets') {
        val = sum.assets;
      } else if (graphMode === 'debts') {
        val = sum.debts;
      } else {
        val = sum.net;
      }
      if (series.negate) {
        val = -val;
      }
      return val;
    },
    defaultSeriesLabelForTags: function defaultSeriesLabelForTags(tags, matchMode) {
      var normalized = this.normalizeTags(tags);
      if (!normalized.length) {
        return '';
      }
      return matchMode === 'all' ? normalized.join(' + ') : normalized.join(' | ');
    },
    buildSeriesChartRows: function buildSeriesChartRows(seriesList, graphMode, endMonthKey) {
      var keys, ki, header, rows, monthKey, monthLabel, row, si, val;
      if (!seriesList || !seriesList.length) {
        return null;
      }
      keys = this.getSeriesChartMonthKeys(seriesList, endMonthKey);
      if (keys.length <= 1) {
        return null;
      }
      header = ['Month'];
      for (si = 0; si < seriesList.length; si++) {
        header.push(seriesList[si].label + (seriesList[si].negate ? ' (sign flipped)' : ''));
      }
      rows = [header];
      for (ki = 0; ki < keys.length; ki++) {
        monthKey = keys[ki].toString();
        monthLabel = this.monthMap[parseInt(monthKey.substring(4), 10)] + ' ' + monthKey.substring(0, 4);
        row = [monthLabel];
        for (si = 0; si < seriesList.length; si++) {
          val = this.getSeriesLineValue(monthKey, graphMode, seriesList[si]);
          row.push(val === null ? null : val);
        }
        rows.push(row);
      }
      return {
        rows: rows,
        monthCount: keys.length
      };
    },
    getNetWorth: function getNetWorth(obj) {
      var Assets,
        Debts,
        Net,
        assetKeys,
        debtKeys,
        hit = false;
      if (!obj) {
        obj = {};
      }
      if (!obj['Asset']) {
        //create a helper function that will check if something exists and if not create empty obj
        obj['Asset'] = {};
      }
      if (!obj['Debt']) {
        //create a helper function that will check if something exists and if not create empty obj
        obj['Debt'] = {};
      }
      assetKeys = Object.keys(obj['Asset']);
      debtKeys = Object.keys(obj['Debt']);
      Assets = assetKeys.reduce(function (prev, current) {
        if (obj['Asset'][current] !== null) {
          prev += obj['Asset'][current];
          hit = true;
        }
        return prev;
      }, 0);
      Debts = debtKeys.reduce(function (prev, current) {
        if (obj['Debt'][current] !== null) {
          hit = true;
          prev += obj['Debt'][current];
        }
        return prev;
      }, 0);
      Net = Assets - Debts;
      if (!hit) {
        return {
          'Net': null
        };
      }
      return {
        'Net': Net,
        'Assets': Assets,
        'Debts': Debts
      };
    }
  };
  return obj;
}();
"use strict";

var _CycleDOM = CycleDOM,
  label = _CycleDOM.label,
  input = _CycleDOM.input,
  hr = _CycleDOM.hr,
  div = _CycleDOM.div,
  h1 = _CycleDOM.h1,
  h4 = _CycleDOM.h4,
  a = _CycleDOM.a,
  span = _CycleDOM.span,
  makeDOMDriver = _CycleDOM.makeDOMDriver,
  button = _CycleDOM.button,
  p = _CycleDOM.p,
  br = _CycleDOM.br,
  h2 = _CycleDOM.h2,
  header = _CycleDOM.header,
  nav = _CycleDOM.nav,
  ul = _CycleDOM.ul,
  li = _CycleDOM.li,
  img = _CycleDOM.img,
  i = _CycleDOM.i,
  main = _CycleDOM.main,
  select = _CycleDOM.select,
  option = _CycleDOM.option;
function page(sources) {
  var headerTree$ = headerModule(sources).DOM;
  var mainTree$ = mainModule(sources).DOM;
  var vtree$ = Rx.Observable.combineLatest(headerTree$, mainTree$, function (headerTree, mainTree) {
    return div([headerTree, br(), mainTree]);
  });
  return {
    DOM: vtree$
  };
}
var drivers = {
  DOM: makeDOMDriver('#app')
};
function headerModule(sources) {
  var watchNav$ = sources.DOM.select('.nav').observable.subscribe(function (el) {
    if (el.length) {
      if (!utility.profileEdit) {
        el[0].getElementsByClassName('logout')[0].hidden = true;
      }
      utility.watchDataProfile(el);
      watchNav$.dispose();
    }
  });
  var editMouseClick$ = sources.DOM.select('.nav .nav-wrapper .name .edit').events('click').subscribe(function (ev) {
    var parent = $(ev.currentTarget.parentElement.parentElement);
    parent.find('.name').hide();
    if (userData.displayName) {
      parent.find('.input-field.col label').addClass('active');
    } else {
      parent.find('.input-field.col label').removeClass('active');
    }
    parent.find('.input-field.col input').val(userData.displayName).focus().parent().show();
  });
  var updateMouseClick$ = sources.DOM.select('.nav .nav-wrapper .update').events('click').subscribe(function (ev) {
    var parent = $(ev.currentTarget.parentElement.parentElement);
    var val = parent.find('.input-field.col').hide().find('#name').val();
    if (!val) {
      parent.find('.name').after(parent.find('.name i'));
      parent.find('.name').show();
      return false;
    }
    userData.displayName = val;
    parent.find('.name').after(parent.find('.name i'));
    parent.find('.name').show().text(val);
    utility.updateUser();
  });
  var networthClick$ = sources.DOM.select('.brand-logo').events('click').subscribe(function (ev) {
    location.href = utility.appUrl();
  });
  sources.DOM.select('.logout').events('click').subscribe(function (ev) {
    firebase.auth().signOut();
    location.href = utility.appUrl();
  });
  var getMouseLeave$ = sources.DOM.select('.nav .nav-wrapper .name').events('mouseenter').map(function (ev) {
    return ev;
  });
  var getMouseEnter$ = sources.DOM.select('.nav .nav-wrapper .name').events('mouseleave').map(function (ev) {
    return ev;
  });
  getMouseLeave$.merge(getMouseEnter$).subscribe(function (ev) {
    if (!utility.profileEdit) {
      return false;
    }
    var el$ = $(ev.currentTarget);
    if (ev.type === 'mouseenter') {
      el$.append($('.edit').removeClass('hide'));
    }
    if (ev.type === 'mouseleave') {
      if (ev.fromElement.className !== 'material-icons edit') {
        $('.edit').addClass('hide');
      }
    }
  });
  var getFocus$ = sources.DOM.select('.input-field input:not(.select-dropdown)').events('focus').map(function (ev) {
    ev.currentTarget.nextSibling.className = "active";
  }).startWith('').subscribe(function () {});
  var getBlur$ = sources.DOM.select('.input-field input:not(.select-dropdown)').events('blur').map(function (ev) {
    if (!ev.currentTarget.value) {
      ev.currentTarget.nextSibling.className = "";
    }
  }).startWith('').subscribe(function () {
    console.log('blur');
  });
  sources.DOM.select('.changeGraph button').events('click').subscribe(function (e) {
    var $target = $(e.target);
    $target.addClass('active').siblings().removeClass('active');
    refreshProfileView();
  });
  sources.DOM.select('.arrow.left').events('click').subscribe(function () {
    userData.lookup -= 1;
    userData.monthString = utility.getMonthString();
    refreshProfileView();
  });
  sources.DOM.select('.arrow.right').events('click').subscribe(function () {
    userData.lookup += 1;
    userData.monthString = utility.getMonthString();
    refreshProfileView();
  });
  sources.DOM.select('.tag-filter-bar, .tag-comparison-section').events('click').subscribe(function (ev) {
    var $target = $(ev.target).closest('.tag-filter-chip, .tag-filter-clear, .tag-filter-add-line, .tag-series-remove, .tag-series-negate, .tag-filter-match-any, .tag-filter-match-all');
    if (!$target.length) {
      return;
    }
    if ($target.hasClass('tag-filter-match-any')) {
      utility.setProfileTagMatchMode('any');
      refreshProfileView();
      return;
    }
    if ($target.hasClass('tag-filter-match-all')) {
      utility.setProfileTagMatchMode('all');
      refreshProfileView();
      return;
    }
    if ($target.hasClass('tag-filter-chip')) {
      $target.toggleClass('active');
      updateProfileTagFilterFromUI();
      refreshProfileView();
      return;
    }
    if ($target.hasClass('tag-filter-clear')) {
      utility.setProfileTagFilter([]);
      $('.tag-filter-chip').removeClass('active');
      refreshProfileView();
      return;
    }
    if ($target.hasClass('tag-filter-add-line')) {
      addTagSeriesFromFilter();
      return;
    }
    if ($target.hasClass('tag-series-negate')) {
      utility.setTagSeriesNegate($target.attr('data-id'), !$target.hasClass('active'));
      refreshProfileView();
      return;
    }
    if ($target.hasClass('tag-series-remove')) {
      utility.removeTagSeries($target.attr('data-id'));
      refreshProfileView();
    }
  });
  sources.DOM.select('.tag-comparison-section').events('click').subscribe(function (ev) {
    var $target = $(ev.target).closest('.tag-comparison-toggle');
    if (!$target.length) {
      return;
    }
    setComparisonPanelOpen(!isComparisonPanelOpen());
  });
  var vtree$ = Rx.Observable.of(div([div('.nav.profile-header', [div('.nav-wrapper', [div('.logout', {
    style: {
      padding: '5px',
      color: '#cecece',
      cursor: 'pointer'
    }
  }, [span('Sign Out')]), a('.brand-logo .center', 'Worth Watchers'), img('.profileImg .center', {
    attributes: {
      alt: 'Profile photo'
    }
  }), label('.name .center' /*,{style:{display:'none'}}*/), div('.input-field .col', {
    style: {
      'display': 'none',
      'width': '150px',
      'margin-left': '50%',
      'position': 'absolute',
      'transform': 'translateX(-50%)',
      'top': '152px'
    }
  }, [input('#name .validate', {
    type: 'text',
    style: {
      'font-size': '16px',
      'text-align': 'center'
    }
  }), label('Name'), i('.material-icons .update', 'done')]), i('.material-icons .edit .hide', 'mode_edit')])]), div('.profile-header-spacer'), div('.row .networth-header', {
    style: {
      visibility: 'hidden',
      'padding-left': '10px'
    }
  }, [div('.col .s12 .m12 .l12 .navigate', [button('.arrow .left', {
    style: {
      display: 'inline-block'
    }
  }, [i(), i()]), div({
    style: {
      display: 'inline-block',
      width: '115px',
      'text-align': 'center'
    }
  }, [label('.nav-title', 'December 2016')]), button('.arrow .right', {
    style: {
      display: 'inline-block'
    }
  }, [i(), i()])]), div('.col .s12 .m12 .l12 .assets', [label('Assets: '), span('.green-text', '')]), div('.col .s12 .m12 .l12 .debts', [label('Debts: '), span('.red-text', '')]), div('.col .s12 .m12 .l12 .networth', [label('Net Worth: '), span('.green-text .text-darken-3', '')])]), br(), div('.row .tag-filter-bar', {
    style: {
      visibility: 'hidden'
    }
  }, [div('.col .s12 .m12 .l12', [div('.tag-filter-header', [span('.tag-filter-title', 'Filter by tags'), span('.tag-filter-actions', [button('.tag-filter-add-line .btn-flat', 'Add line'), button('.tag-filter-clear .btn-flat', 'Clear')])]), p('.tag-filter-hint .grey-text', 'Select tags to filter this month. Match mode applies to the filter and new comparison lines.'), div('.tag-filter-match-mode', [span('.tag-filter-match-label', 'Match:'), button('.tag-filter-match-any .btn-flat .active', 'Any tag'), button('.tag-filter-match-all .btn-flat', 'All tags')]), label('.tag-series-add-negate-wrap', [input('.tag-series-add-negate', {
    type: 'checkbox'
  }), span(' Flip sign for next line (invert positive/negative on chart)')]), div('.tag-filter-chips'), div('.tag-filter-matches')])]), div('.row .tag-comparison-section', {
    style: {
      display: 'none'
    }
  }, [div('.col .s12 .m12 .l12', [button('.tag-comparison-toggle .btn-flat', {
    type: 'button'
  }, [i('.material-icons .tag-comparison-chevron', 'expand_more'), span('.tag-comparison-toggle-label', 'Tag comparison'), span('.tag-comparison-count .grey-text', '')]), div('.tag-comparison-body', [div('.tag-series-list'), div('.tag-comparison-chart-wrap', [p('.tag-series-chart-hint .grey-text', 'Comparison chart (Net Worth / Assets / Debts tabs apply)'), div('.card-panel .tag-series-chart-panel', [div('#curve_chart_compare')])])])])]), br(), div('.row .profile-charts-row', [div('.col .s12 .m12 .l12 .changeGraph', [button('.netWorthGraph .active .drawn', 'Net Worth'), button('.assetsGraph', 'Assets'), button('.debtsGraph', 'Debts')]), div('.col .s12 .offset-m1 .m10 .offset-l2 .l8', {
    style: {
      'padding-left': '20px'
    }
  }, [div('.card-panel .profile-line-chart-panel', [div('#curve_chart'), div('#curve_chart_assets'), div('#curve_chart_debts')])]), br(), div('.col .s6 .offset-m1 .m5 .offset-l2 .l4', {
    style: {
      'padding-left': '20px'
    }
  }, [div('.card-panel .profile-pie-panel', [div('#pie_chart1')])]), div('.col .s6 .m5 .l4', [div('.card-panel .profile-pie-panel', [div('#pie_chart2')])])]), br(), br()]));
  return {
    DOM: vtree$
  };
}
function mainModule(sources) {
  var vtree$ = Rx.Observable.of(div([
    /*p('main')*/
  ]));
  return {
    DOM: vtree$
  };
}

//firebase.auth().signOut();

var initApp = function initApp() {
  var userLookup,
    index,
    doc = document;
  var params = new URLSearchParams(location.search);
  userLookup = params.get('user');
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      userData.accountName = user.displayName;
      userData.accountURL = user.photoURL || utility.assetUrl('img/anony.jpg');
    }
    if (userLookup) {
      utility.setDatabase(userLookup);
      Cycle.run(page, drivers);
      if (!user || user.uid !== userLookup) {
        utility.profileEdit = false;
      }
    } else if (user) {
      utility.setDatabase(user.uid);
      Cycle.run(page, drivers);
      params.set('user', user.uid);
      var profilePath = location.pathname;
      if (profilePath.slice(-8) === '/profile') {
        profilePath += '/';
      }
      history.replaceState('', 'Net Worth Profile', profilePath + '?' + params.toString());
    } else {
      location.href = utility.appUrl();
    }
  }, function (error) {
    console.log(error);
  });
};
window.addEventListener('load', function () {
  initApp();
});
function isComparisonPanelOpen() {
  if (userData.comparisonPanelOpen === undefined) {
    userData.comparisonPanelOpen = utility.getTagSeriesList().length > 0;
  }
  return !!userData.comparisonPanelOpen;
}
function setComparisonPanelOpen(open) {
  userData.comparisonPanelOpen = !!open;
  updateComparisonPanelUI();
}
function updateComparisonPanelUI() {
  var $section = $('.tag-comparison-section');
  var open = isComparisonPanelOpen();
  $section.toggleClass('collapsed', !open);
  $section.find('.tag-comparison-chevron').text(open ? 'expand_less' : 'expand_more');
  if (open) {
    drawTagSeriesChart(getLineGraphMode(getActiveGraphTitle()));
  }
}
function renderTagComparisonSection() {
  var seriesList = utility.getTagSeriesList();
  var $section = $('.tag-comparison-section');
  if (!seriesList.length) {
    $section.hide();
    return;
  }
  $section.show();
  $section.find('.tag-comparison-count').text('(' + seriesList.length + ' line' + (seriesList.length === 1 ? '' : 's') + ')');
  updateComparisonPanelUI();
}
function refreshProfileView() {
  var dataObj = userData.entries[userData.keys[userData.lookup]];
  populateNetWorthGraph(dataObj);
}
function updateProfileTagFilterFromUI() {
  var selected = [];
  $('.tag-filter-chip.active').each(function () {
    selected.push($(this).attr('data-tag'));
  });
  utility.setProfileTagFilter(selected);
}
function profileToast(message) {
  if (typeof Materialize !== 'undefined' && Materialize.toast) {
    Materialize.toast(message, 4000);
  } else {
    window.alert(message);
  }
}
function renderTagFilterBar() {
  var tags = utility.getAllTags(),
    filter = utility.getProfileTagFilter(),
    $bar = $('.tag-filter-bar'),
    $chips = $bar.find('.tag-filter-chips'),
    $addLine = $bar.find('.tag-filter-add-line'),
    $negateWrap = $bar.find('.tag-series-add-negate-wrap'),
    html = '',
    i,
    active;
  if (!tags.length) {
    $bar.css('visibility', 'hidden');
    return;
  }
  $bar.css('visibility', 'visible');
  for (i = 0; i < tags.length; i++) {
    active = filter.indexOf(tags[i]) >= 0 ? ' active' : '';
    html += '<button type="button" class="tag-filter-chip' + active + '" data-tag="' + utility.escapeHtml(tags[i]) + '">' + utility.escapeHtml(tags[i]) + '</button>';
  }
  $chips.html(html);
  if (utility.getProfileTagMatchMode() === 'all') {
    $bar.find('.tag-filter-match-any').removeClass('active');
    $bar.find('.tag-filter-match-all').addClass('active');
  } else {
    $bar.find('.tag-filter-match-all').removeClass('active');
    $bar.find('.tag-filter-match-any').addClass('active');
  }
  if (filter.length && utility.profileEdit && utility.getTagSeriesList().length < 5) {
    $addLine.show();
    $negateWrap.show();
  } else {
    $addLine.hide();
    $negateWrap.hide();
  }
}
function renderTagFilterMatches(matches) {
  var $el = $('.tag-filter-matches'),
    filter = utility.getProfileTagFilter(),
    html,
    i,
    m;
  if (!filter.length) {
    $el.empty().hide();
    return;
  }
  if (!matches.length) {
    $el.html('<p class="grey-text tag-filter-empty">No entries match these tags for this month.</p>').show();
    return;
  }
  html = '<ul class="tag-match-list">';
  for (i = 0; i < matches.length; i++) {
    m = matches[i];
    html += '<li><span class="' + (m.type === 'Asset' ? 'green-text' : 'red-text') + '">' + m.type + ': ' + utility.escapeHtml(m.name) + '</span> — $' + parseFloat(m.value).toLocaleString(undefined, {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }) + '</li>';
  }
  html += '</ul>';
  $el.html(html).show();
}
function formatMoney(amount) {
  return '$' + parseFloat(amount).toLocaleString(undefined, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  });
}
function getLineGraphMode(title) {
  if (title === 'Assets') {
    return 'assets';
  }
  if (title === 'Debts') {
    return 'debts';
  }
  return 'net';
}
function getActiveGraphTitle() {
  var activeTab = $('.changeGraph .active');
  if (activeTab.text() === 'Assets') {
    return 'Assets';
  }
  if (activeTab.text() === 'Debts') {
    return 'Debts';
  }
  return 'Net Worth';
}
function addTagSeriesFromFilter() {
  var tags = utility.getProfileTagFilter(),
    label,
    id;
  if (!tags.length) {
    profileToast('Select one or more tags first, then click Add line.');
    return;
  }
  if (utility.findTagSeriesByTags(tags, utility.getProfileTagMatchMode())) {
    profileToast('A line with these tags and match mode already exists.');
    return;
  }
  if (utility.getTagSeriesList().length >= 5) {
    profileToast('You can save up to 5 comparison lines.');
    return;
  }
  label = utility.defaultSeriesLabelForTags(tags, utility.getProfileTagMatchMode());
  id = utility.saveTagSeries(label, tags, $('.tag-series-add-negate').prop('checked'), utility.getProfileTagMatchMode());
  if (!id) {
    profileToast('Could not save this line.');
    return;
  }
  utility.setProfileTagFilter([]);
  $('.tag-filter-chip').removeClass('active');
  $('.tag-series-add-negate').prop('checked', false);
  setComparisonPanelOpen(true);
  profileToast('Added comparison line: ' + label);
  refreshProfileView();
}
function renderTagSeriesList() {
  var seriesList = utility.getTagSeriesList();
  var $list = $('.tag-series-list');
  var html, i, s;
  if (!seriesList.length) {
    $list.empty().hide();
    return;
  }
  html = '<p class="tag-series-list-title">Comparison lines</p><ul class="tag-series-saved">';
  for (i = 0; i < seriesList.length; i++) {
    s = seriesList[i];
    html += '<li class="tag-series-item"><span class="tag-series-item-label">' + utility.escapeHtml(s.label) + '</span> <span class="tag-series-match-label grey-text">(' + (s.match === 'any' ? 'any tag' : 'all tags') + ')</span>';
    if (utility.profileEdit) {
      html += ' <button type="button" class="tag-series-negate btn-flat' + (s.negate ? ' active' : '') + '" data-id="' + utility.escapeHtml(s.id) + '">Flip sign</button>';
      html += ' <button type="button" class="tag-series-remove btn-flat" data-id="' + utility.escapeHtml(s.id) + '">Remove</button>';
    } else if (s.negate) {
      html += ' <span class="tag-series-negate-label">(sign flipped)</span>';
    }
    html += '</li>';
  }
  html += '</ul>';
  $list.html(html).show();
}
function drawTagSeriesChart(graphMode) {
  var seriesList = utility.getTagSeriesList();
  var $section = $('.tag-comparison-section');
  var $chartWrap = $('.tag-comparison-chart-wrap');
  var $el = $('#curve_chart_compare');
  var monthKey, chartData, rows, data, width, ratio, options, title, chart, subtitle;
  if (!seriesList.length || userData.lookup === 0 || !isComparisonPanelOpen()) {
    $chartWrap.hide();
    return;
  }
  monthKey = userData.keys[userData.lookup];
  chartData = utility.buildSeriesChartRows(seriesList, graphMode, monthKey);
  if (!chartData) {
    $chartWrap.hide();
    return;
  }
  rows = chartData.rows;
  $section.show();
  $chartWrap.show();
  $el.show();
  data = google.visualization.arrayToDataTable(rows);
  width = $el.parent().width() - 10;
  ratio = 2.2;
  if (width < 900) {
    ratio = 1.5;
  }
  if (width < 450) {
    ratio = 1.2;
  }
  if (graphMode === 'assets') {
    title = 'Assets';
  } else if (graphMode === 'debts') {
    title = 'Debts';
  } else {
    title = 'Net Worth';
  }
  subtitle = chartData.monthCount + ' month' + (chartData.monthCount === 1 ? '' : 's') + ' with tagged entries';
  if (chartData.monthCount < userData.lookup + 1) {
    subtitle += ' (zoomed to tagged date range)';
  }
  options = {
    chart: {
      title: title + ' by tag group (through ' + userData.monthString + ')',
      subtitle: subtitle
    },
    width: width,
    height: width / ratio,
    series: {
      0: {
        color: '#4caf50'
      },
      1: {
        color: '#2196f3'
      },
      2: {
        color: '#ff9800'
      },
      3: {
        color: '#9c27b0'
      },
      4: {
        color: '#e91e63'
      }
    }
  };
  chart = new google.charts.Line($el[0]);
  chart.draw(data, options);
}
function updateView() {
  $('.arrow').css('display', 'inline-block');
  $('#curve_chart').parent().show();
  $('.changeGraph').show().css({
    opacity: 1,
    visibility: 'visible'
  });
  if (userData.lookup === userData.keys.length - 1) {
    $('.arrow.right').hide();
  }
  if (userData.lookup === 0) {
    $('.arrow.left').hide();
    $('#curve_chart').parent().hide();
    $('.changeGraph').hide();
  }
}
function drawLineGraph(ind, passedInTitle) {
  var i,
    indicator = ind || '',
    title = passedInTitle || "Net Worth",
    graphMode = getLineGraphMode(passedInTitle),
    filterTags = utility.getProfileTagFilter(),
    tagMatchMode = utility.getProfileTagMatchMode(),
    currentString = userData.keys[userData.lookup],
    entryKeys = [],
    networthMonth,
    temp,
    val;
  var $el = $(document.getElementById('curve_chart' + indicator)),
    dataArr,
    width,
    ratio = 2.2;
  for (i = 0; i < userData.keys.length; i++) {
    entryKeys.push(userData.keys[i]);
    if (userData.keys[i] === currentString) {
      break;
    }
  }
  $el.hide();
  if (entryKeys.length <= 1) {
    return false;
  }
  if (entryKeys.length) {
    temp = entryKeys[entryKeys.length - 1];
    userData.currentMonth = parseInt(temp.substring(4));
    userData.currentYear = temp.substring(0, 4);
  }
  dataArr = entryKeys.reduce(function (prev, key) {
    var keyString = key.toString(),
      month = utility.monthMap[parseInt(keyString.substring(4))],
      year = keyString.substring(0, 4);
    networthMonth = month + " " + year;
    val = utility.getFilteredLineValue(key, graphMode, filterTags, tagMatchMode);
    if (val === null) {
      val = 0;
    }
    prev.push([networthMonth, val]);
    return prev;
  }, [['Month', title]]);
  var data = google.visualization.arrayToDataTable(dataArr);
  width = $el.parent().width() - 5;

  //debugger;
  if (width < 900) {
    ratio = 1.5;
  }
  if (width < 450) {
    ratio = 1.2;
  }
  var options = {
    chart: {
      title: title + ' as of ' + networthMonth,
      subtitle: utility.formatTagFilterSubtitle(filterTags, tagMatchMode)
    },
    width: width,
    height: width / ratio
  };
  var chart = new google.charts.Line($el[0]);
  chart.draw(data, options);
  $el.fadeIn('slow').siblings().hide();
}
function drawPieGraphs() {
  var rows = [],
    chart,
    el = document.getElementById('pie_chart1'),
    el2 = document.getElementById('pie_chart2'),
    width,
    ratio = 2.2,
    filterTags = utility.getProfileTagFilter(),
    tagMatchMode = utility.getProfileTagMatchMode();
  var currentString = userData.keys[userData.lookup];
  el.hidden = true;
  el2.hidden = true;

  // Create the data table.
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'Asset');
  data.addColumn('number', 'Amount');
  if (userData.entries[currentString] && userData.entries[currentString].Asset) {
    rows = Object.keys(userData.entries[currentString].Asset).filter(function (key) {
      return utility.entryMatchesTags(currentString, 'Asset', key, filterTags, tagMatchMode);
    }).map(function (key) {
      return [key, parseFloat(userData.entries[currentString].Asset[key])];
    });
  }
  width = $(el).parent().width();
  width = width + .05 * width;

  //debugger;
  if (width < 900) {
    ratio = 1.5;
  }
  if (width < 450) {
    ratio = 1.2;
  }
  var options = {
    'title': filterTags.length ? 'Assets (filtered)' : 'Asset Allocation',
    width: width,
    height: width / ratio
  };
  if (rows.length) {
    data.addRows(rows);
    chart = new google.visualization.PieChart(el);
    el.hidden = false;
    chart.draw(data, options);
  }

  //NEW

  data = new google.visualization.DataTable();
  data.addColumn('string', 'Debt');
  data.addColumn('number', 'Amount');
  rows = [];
  if (userData.entries[currentString] && userData.entries[currentString].Debt) {
    rows = Object.keys(userData.entries[currentString].Debt).filter(function (key) {
      return utility.entryMatchesTags(currentString, 'Debt', key, filterTags, tagMatchMode);
    }).map(function (key) {
      return [key, parseFloat(userData.entries[currentString].Debt[key])];
    });
  }
  if (rows.length) {
    data.addRows(rows);

    // Set chart options
    options.title = filterTags.length ? 'Debt (filtered)' : 'Debt Allocation';

    // Instantiate and draw our chart, passing in some options.
    chart = new google.visualization.PieChart(el2);
    el2.hidden = false;
    chart.draw(data, options);
  }
}
function populateNetWorthGraph(dataObj) {
  var networthHeader,
    indicator = "",
    title = "",
    activeTab,
    monthKey,
    totals,
    filter;
  if (dataObj) {
    monthKey = userData.keys[userData.lookup];
    filter = utility.getProfileTagFilter();
    totals = utility.sumTaggedEntries(monthKey, filter, utility.getProfileTagMatchMode());
    updateView();
    renderTagFilterBar();
    renderTagFilterMatches(totals.matches);
    renderTagSeriesList();
    renderTagComparisonSection();
    networthHeader = document.getElementsByClassName('networth-header')[0];
    networthHeader.getElementsByClassName('nav-title')[0].textContent = userData.monthString;
    networthHeader.getElementsByClassName('networth')[0].getElementsByTagName('span')[0].textContent = formatMoney(totals.net);
    networthHeader.getElementsByClassName('assets')[0].getElementsByTagName('span')[0].textContent = formatMoney(totals.assets);
    networthHeader.getElementsByClassName('debts')[0].getElementsByTagName('span')[0].textContent = formatMoney(totals.debts);
    networthHeader.style.visibility = "";
    if (filter.length) {
      networthHeader.classList.add('tag-filter-active');
    } else {
      networthHeader.classList.remove('tag-filter-active');
    }
    activeTab = $('.changeGraph .active');
    if (activeTab.text() === "Assets") {
      indicator = "_assets";
      title = "Assets";
    }
    if (activeTab.text() === "Debts") {
      indicator = "_debts";
      title = "Debts";
    }
    $('.changeGraph').css({
      opacity: 1,
      visibility: 'visible'
    });
    $('.profile-charts-row .card-panel').css('opacity', 1);
    drawLineGraph(indicator, title);
    drawPieGraphs();
    if (isComparisonPanelOpen()) {
      drawTagSeriesChart(getLineGraphMode(getActiveGraphTitle()));
    }
  }
}
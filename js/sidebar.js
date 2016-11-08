
function sideNavModule(sources){

  let vtree$;

  let getMouseLeave$ = sources.DOM.select('.collapsible-body ul li a').events('mouseenter').map(ev => {
      return ev;
  });

  let getMouseEnter$ = sources.DOM.select('.collapsible-body ul li a').events('mouseleave').map(ev => {
      return ev;
  });

  getMouseLeave$.merge(getMouseEnter$).subscribe((ev)=>{
      let el$ = $(ev.currentTarget);
      if(ev.type === 'mouseenter'){
        el$.append($('.edit').removeClass('hide'));
      }
      if(ev.type === 'mouseleave'){
            if(ev.fromElement.className !== 'material-icons edit'){
                $('.edit').addClass('hide');
            }
      }
  });
    
  let getClickSideBar$ = sources.DOM.select('.collapsible-header').events('click').map(ev => {
    let $target = $(ev.currentTarget);
    $target.toggleClass('active');
    accordionOpen($target); 
  }).startWith('');
    
  let getClickAdd$ = sources.DOM.select('.btn-floating.add').events('click').map(ev => {
    $('#modal1').openModal();     
  });

  let getClickEdit$ = sources.DOM.select('.material-icons.edit').events('click').map(ev => {
      let item = ev.currentTarget.parentElement,
      infoItems, itemType, index,
      itemClass = item.parentElement.className,
      modal2 = $('#modal2');
      if(itemClass === 'asset-items'){
          itemType = 'Asset';
          index = 1;
      }
      if(itemClass === 'debt-items'){
          itemType = 'Debt';
          index = 2;
      }
      infoItems = item.firstChild.innerText.split(' - ');
      infoItems[1] = infoItems[1].replace(/,/g, "").substring(index);

      $('#modal2').find('select')[0].disabled = true;
      $('#modal2').find('select').val(itemType).material_select();
      $('#modal2').find('#name').val(infoItems[0]).next().addClass('active');
      $('#modal2').find('#value').val(infoItems[1]).next().addClass('active');
      $('#modal2').data("item",item);
      $('#modal2').openModal();     
  });
    
  let getClicks$ = getClickSideBar$.merge(getClickAdd$).merge(getClickEdit$);
    
  watchSidebar$ = sources.DOM.select('.side-nav li .collapsible')
                       .observable
                       .subscribe((el)=>{
                            //$(el).append(temp);
                            if(el.length){
                                utility.watchData(el);
                                watchSidebar$.dispose();
                            }   
                        });
    
  vtree$ = getClicks$.map(()=>
            div([
                ul('.side-nav .fixed #nav-mobile',[
                    li('.side-nav-top',[
                        span('#logo .noselect',[
                            img({src:'https://material.google.com/static/images/nav_google_logo.svg'})
                        ]),
                        a('.add .btn-floating .btn-large .waves-effect .waves-light .green',[
                            i('.material-icons','add')    
                        ])
                    ]),
                    li('.no-padding',[
                        ul('.collapsible .collapsible-accordion',[
                            li('.bold',[
                                a('.collapsible-header .waves-effect .waves-teal .asset','Assets'),
                                div('.collapsible-body',[
                                    ul([
                                        li('.asset-items')
                                    ])
                                ])
                            ]),
                            li('.bold',[
                                a('.collapsible-header .waves-effect .waves-teal .debt','Debts'),
                                div('.collapsible-body',[
                                    ul([
                                        li('.debt-items')
                                    ])
                                ])
                            ])
                        ])
                    ])
                  ]),
                  i('.material-icons .edit .hide','mode_edit') // to do give this background and waves
                ])
      );
    
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

function populateNetWorthValues(dataObj,$elAsset,$elDebt){
    $elAsset.empty();
    $elDebt.empty();
    if(dataObj){
        addValues(dataObj['Asset'],'$','Asset',$elAsset);
        addValues(dataObj['Debt'],'$','Debt',$elDebt);
    }
}

function addValues(valueObj,prefix,type,$el){ 
    if(valueObj){
    //debugger;
        Object.keys(valueObj).map(function(key){
            let entry = utility.formatEntry({type:type,value:valueObj[key]});
            $el.append('<a><span style="pointer-events:none;">' + key + ' - <span style="font-size:12px;pointer-events: none;" class="'+entry.class+'">' + entry.display + '</span></span></a>');
        });
        
    }
}



/*
 * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
 *
 * Uses the built in easing capabilities added In jQuery 1.1
 * to offer multiple easing options
 *
 * TERMS OF USE - jQuery Easing
 *
 * Open source under the BSD License.
 *
 * Copyright © 2008 George McGinley Smith
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list
 * of conditions and the following disclaimer in the documentation and/or other materials
 * provided with the distribution.
 *
 * Neither the name of the author nor the names of contributors may be used to endorse
 * or promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 *
*/

// t: current time, b: begInnIng value, c: change In value, d: duration
jQuery.easing['jswing'] = jQuery.easing['swing'];

jQuery.extend( jQuery.easing,
{
	easeOutQuart: function (x, t, b, c, d) {
		return -c * ((t=t/d-1)*t*t*t - 1) + b;
	},
    easeOutSine: function (x, t, b, c, d) {
		return c * Math.sin(t/d * (Math.PI/2)) + b;
	},
    easeOutCubic: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t + 1) + b;
	}
});

/*
 *
 * TERMS OF USE - EASING EQUATIONS
 *
 * Open source under the BSD License.
 *
 * Copyright © 2001 Robert Penner
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list
 * of conditions and the following disclaimer in the documentation and/or other materials
 * provided with the distribution.
 *
 * Neither the name of the author nor the names of contributors may be used to endorse
 * or promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */;    // Custom Easing
    jQuery.extend( jQuery.easing,
    {
      easeInOutMaterial: function (x, t, b, c, d) {
        if ((t/=d/2) < 1) return c/2*t*t + b;
        return c/4*((t-=2)*t*t + 2) + b;
      }
    });

;
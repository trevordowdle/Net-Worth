

function modalModule(sources,options){

  let vtree$;
    
  if(!options){ // use a method to combine objects
      options = {
        disabled: false,
        selector: '#modal1 .modal',
        title: 'New Entry',
        buttons: [
                    {
                        text:'ADD',
                        doClick: addClick,
                        selector:'.modal-action-add'
                    }
                 ]
      }
  }

  let ModalActionArr$ = options.buttons.map((button)=>{
      return sources.DOM.select('.modal '+button.selector).events('click').map(button.doClick);
  });
    
  //let modalAdd$ = sources.DOM.select('.modal .modal-action').events('click').map(options.doClick);

    
  let watchSelect$ = sources.DOM.select('select')
                       .observable
                       .subscribe((el)=>{
                            if(el.length){
                                el[0][0].disabled = true;
                                $(el).material_select();
                                watchSelect$.dispose();
                            }   
                        });

  sources.DOM.select('#value').events('keyup')
  .subscribe((ev)=>{
    if(/[^\d.,]/.test(ev.target.value)){
      ev.target.value = ev.target.value.replace(/[^\d.,]/g, '');
    }
  });

  let getFocus$ = sources.DOM.select('.input-field input:not(.select-dropdown)').events('focus').map(ev => {
    ev.currentTarget.nextSibling.className = "active";
  }).startWith('');
    
  let getBlur$ = sources.DOM.select('.input-field input:not(.select-dropdown)').events('blur').map(ev => {
    if(!ev.currentTarget.value){
        ev.currentTarget.nextSibling.className = "";
    }
  }).startWith('');
    
  //let getEvents$ = getFocus$.merge(getBlur$).merge(modalAdd$);
  let getEvents$ = getFocus$.merge(getBlur$);

  ModalActionArr$.map((modalAction$)=>{
      getEvents$ = getEvents$.merge(modalAction$);
  });
    
  vtree$ = getEvents$.map(
        div([
            div(options.selector,[
              div('.modal-content',[
                h4(options.title),
                div('.row',[
                  div('.col .s12',[
                    div('.row',[
                        div('.input-field .col .s12',[
                            select('#entry',[
                                option('Choose Entry Type'),
                                option('Asset'),
                                option('Debt')
                            ]),
                            label('Entry Type')
                        ])    
                    ]),
                    div('.row',[
                     div('.input-field .col .s6',[
                        input('#name .validate',{type:'text',disabled:options.disabled}),
                        label('Name')
                      ]),
                      div('.input-field .col .s3',[
                        input('#value .validate'),
                        label('Value')
                      ])
                    ])
                  ])
                ]) 
              ]),
              div('.modal-footer',options.buttons.map((button)=>{
                let float = button.float || '';
                return a(float + button.selector + ' .waves-effect .waves-green .btn-flat',button.text);   
              }))    
            ])
        ])
    );  
    
  return {
    DOM: vtree$
  };

}


toastMap = {
  'Choose Entry Type':'You need to specify whether this entry is an Asset or a Debt.',
  'AssetName':'You must specify a name for your asset.',
  'DebtName':'You must specify a name for your debt.',
  'AssetValue':'You must specify how much your asset is worth.',
  'DebtValue':'You must specify the amount of your debt.'
}

/*

      if(temp === 'value' && entry.type === 'Asset'){
        Materialize.toast('You must specify how much your asset is worth.', 4000);
      }
      else if(temp === 'value' && entry.type === 'Debt'){
        Materialize.toast('You must specify the amount of your debt.', 4000);  
      }
      else if(temp === 'value'){

      }
      else {
        Materialize.toast((temp[0].toUpperCase() + temp.substring(1)) + ' is a required field.', 4000);
      }

*/

addClick = (ev)=>{
      let invalid = false, $modal, $inputs, temp, path, entry = {}, toastString;
      $modal = $(ev.currentTarget.closest('.modal'));
      $inputs = $modal.find('.modal-content input');
      $inputs.each((index,el)=>{
        if(!el.value || el.value === 'Choose Entry Type'){
          //temp = el.id || 'type';
          //Materialize.toast((temp[0].toUpperCase() + temp.substring(1)) + ' is a required field.', 4000);
          invalid = true;
        }
        entry[el.id || 'type'] = el.value;
      });
      
      if(invalid){
        toastString = entry.type;
        if(toastString === 'Asset' || toastString === 'Debt'){
          if(!entry.name){
            toastString += 'Name';
          }
          else if(!entry.value){
            toastString += 'Value';
          }
        }
        Materialize.toast(toastMap[toastString], 4000);
        console.log('invalid');
      }
      else {        
        entry = utility.formatEntry(entry);
        
          //here//
        $('.'+entry.type.toLowerCase()).next().find('ul li').append('<a><span style="pointer-events:none;">' + entry.name + ' - <span style="font-size:12px;pointer-events: none;" class="'+entry.class+'">' + entry.display + '</span></span></a>');
        $inputs[0].value = 'Choose Entry Type';
        $inputs.filter(function(index){return index > 0;}).val('').next('label').removeClass('active');
          
        utility.updateData(entry);

        $modal.closeModal();
      }
      // check entry
      // add entry
    };


updateClick = (ev)=>{
    
    let invalid = false, $modal, $inputs, temp, path, entry = {};
    $modal = $(ev.currentTarget.closest('.modal'));
    $inputs = $modal.find('.modal-content input');
    $inputs.each((index,el)=>{
      if(!el.value || el.value === 'Choose Entry Type'){
        temp = el.id || 'type';
        Materialize.toast((temp[0].toUpperCase() + temp.substring(1)) + ' is a required field.', 4000);
        invalid = true;
      }
      entry[el.id || 'type'] = el.value;
    });
    entry = utility.formatEntry(entry);
    $modal.data('item').children[0].className = '';
    $modal.data('item').children[0].children[0].innerText = entry.display;
    utility.updateData(entry);
    $modal.closeModal();
    //Materialize.toast('Update', 4000);
};

removeClick = (ev)=>{
    let $modal, $inputs, entry = {}, element, edit;
    $modal = $(ev.currentTarget.closest('.modal'));
    $inputs = $modal.find('.modal-content input');
    $inputs.each((index,el)=>{
      entry[el.id || 'type'] = el.value;
    });
    entry = utility.formatEntry(entry);
    element = $modal.data('item');
    moveEdit(element);
    element.parentNode.removeChild(element);
    entry.value = null;
    utility.updateData(entry);
    $modal.closeModal();
    //Materialize.toast('Remove', 4000);
};

moveEdit = (element)=>{
    edit = element.getElementsByClassName('edit');
    if(edit.length){
        element.parentElement.parentElement.appendChild(edit[0]);    
    }
};



  
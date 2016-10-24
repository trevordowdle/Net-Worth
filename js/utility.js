function getDateObject(dateString){
    let date, dateObject = {};
    if(dateString){
        date = new Date(dateString);
    } 
    date = date || new Date();
    dateObject.date = date;
    dateObject.month = date.getMonth() + 1;
    dateObject.year = date.getFullYear();
    return dateObject;
}
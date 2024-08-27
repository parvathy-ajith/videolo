$('.report-table tbody tr').each(function () {
    var number = parseFloat($(this).find(".currency").html());
    console.log(number);
    var currency = number.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        style: 'currency',
        currency: 'INR'
    });
    console.log(currency);
    $(this).find(".currency").html(currency);
});
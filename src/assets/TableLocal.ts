export  const TableLocal = {
    footerLeft: (top:any, bottom:any, total:any) => `حقل ${top} الى ${bottom} من ${total}`,
    first: 'الاول',
    previous: 'السابق',
    next: 'التالي',
    last: 'الاخر',
    footerRight: {
        selected: 'تحديد:',
        filtered: 'تصفية:',
        loaded: 'اجمالي:'
    },
    processing: 'معالجة',
    tableSetting: 'اعدادت',
    exportExcel: 'تصدير Excel',
    importExcel: 'استيرا Excel',
    back: 'خلف',
    reset: 'مسح',
    sortingAndFiltering: 'الفرز والتصفية',
    sortAscending: 'ترتيب تصاعدي',
    sortDescending: 'ترتيب تنازلي',
    near: '≒ قريب',
    exactMatch: '= تطابق تام',
    notMatch: '≠ غير متطابق',
    greaterThan: '&gt; اكثر من',
    greaterThanOrEqualTo: '≥ أكبر من أو يساوي',
    lessThan: '&lt; اقل من',
    lessThanOrEqualTo: '≤ اقل او يساوي',
    regularExpression: '~ تعبير عادي',
    customFilter: 'تصفية مخصص',
    listFirstNValuesOnly: n => ` قم بإدراج القيم ${n} الأولى فقط `,
    apply: 'تطبيق',
    noRecordIsRead: 'لا تتم قراءة أي سجل',
    readonlyColumnDetected: 'عمود للقراءة فقط',
    columnHasValidationError: (name:any, err:any) => `Column ${name} has validation error: ${err}`,
    noMatchedColumnName: 'لا يوجد اسم عمود مطابق',
    invalidInputValue: 'قيمة إدخال غير صالحة',
    missingKeyColumn: 'عمود المفتاح مفقود',
    noRecordIndicator: 'لايوجد بيانات'
}






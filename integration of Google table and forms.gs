  function onFormSubmit() {

    var form = getActiveFormWithBackoff();

    formResponses = form.getResponses(),
    latestFR = formResponses[form.getResponses().length-1];

    const itemResponses = latestFR.getItemResponses(),
    avto = itemResponses[0].getResponse(),
    dogovor = itemResponses[1].getResponse();
    dateResponse = itemResponses[2].getResponse();
    let date_dds;
    // Проверка, заполнено ли поле даты
    if (dateResponse !== "") {
      // Если поле даты заполнено, используем значение из поля
      date_dds = dateResponse;
    } else {
      // Если поле даты не заполнено, устанавливаем сегодняшнюю дату
      date_dds = new Date();
    }
    sum = itemResponses[3].getResponse();
    wallet = itemResponses[4].getResponse();
    notes = itemResponses[5].getResponse();
    article = itemResponses[6].getResponse();

    var ss = SpreadsheetApp.openById(''); // ID таблицы
    var cashSheet = ss.getSheetByName('Касса');
    var sheet = ss.getSheetByName('Технический лист');
    var lastRow = sheet.getRange('AJ2').getValue(); // Получаем значение из ячейки 

  // проверка заполнено ли поле № Договора
    if (dogovor !== "") {
      // если поле заполнено, в колонку Авто прописываем формулу для извлечения № авто
      avtov2 = '=IFERROR(REGEXEXTRACT(B' + (lastRow + 1) + ';"^(.*)-[^-]*$");"")'
      // Записываем ответы из формы в первую пустую строку листа "Касса"
      cashSheet.getRange(lastRow + 1, 2, 1, 4).setValues([[dogovor, date_dds, sum, wallet]]);
      cashSheet.getRange(lastRow + 1, 1).setFormula(avtov2)
    } else {
      cashSheet.getRange(lastRow + 1, 1, 1, 5).setValues([[avto, dogovor, date_dds, sum, wallet]]);
    }
    // Записываем переменные notes и article в столбцы J и K соответственно
    cashSheet.getRange(lastRow + 1, 10).setValue(notes); // Записываем переменную notes в столбец J
    cashSheet.getRange(lastRow + 1, 11).setValue(article);

    // вызываем скрипт обновления описания поля Сумма
    changeDescription();

    // если выбран чекбокс в поле Обновить данные, то вызываем скрипты для обновления 
    if (itemResponses.length > 7) {
        updateForm()
        updateFormFieldAvto()
    }
  }


  function changeDescription() {
    var form = FormApp.getActiveForm();
    var items = form.getItems(FormApp.ItemType.TEXT);
    var textFieldTitle = 'Сумма'; // Название текстового поля

    for (var i = 0; i < items.length; i++) {
      if (items[i].getTitle() === textFieldTitle) {
        var textField = items[i];
        break;
      }
    }
    var ss = SpreadsheetApp.openById(''); // ID таблицы
    var sheet = ss.getSheetByName('Касса'); // Имя листа в таблице
    var cellValue = sheet.getRange('A3').getValue(); // Получаем значение из ячейки A3 общая касса
    var cellValue1 = sheet.getRange('C1').getValue(); // Касса (Карта)
    var cellValue2 = sheet.getRange('C2').getValue(); // Карта Учредитель1
    var cellValue3 = sheet.getRange('C3').getValue(); // Карта Учредитель2
    var cellValue4 = sheet.getRange('E1').getValue(); // Карта Учредитель3
    var cellValue5 = sheet.getRange('E2').getValue(); // Карта Учредитель4

    // Меняем описание поля
    textField.setHelpText("Сумма операции цифрами. Если Выбытие, перед суммой ставим - (минус). \nИтого Касса =  " +cellValue+ ". \nКарта Учредитель1 = " +cellValue2+ ". \nКарта Учредитель2 = " +cellValue4+ ". \nКарта Учредитель3 = " +cellValue5 + ". \nКарта Учредитель4 = " +cellValue3+ ". \nКарта (Офис) = " +cellValue1);
}


function updateForm() {
  var form = FormApp.getActiveForm();
  var items = form.getItems(FormApp.ItemType.LIST);
  
  // Настройки для каждого поля: название листа и диапазон значений
  var fields = [
    //{ fieldName: 'Авто', sheetName: 'Автомобили', range: 'A5:A'},
    { fieldName: '№ Договора', sheetName: 'Учет сделок', range: 'B6:B', statusColumn: 'F6:F' },
    { fieldName: 'Кошелек', sheetName: 'ДДС: настр.', range: 'A4:A8' },
    { fieldName: 'Статья', sheetName: 'ДДС: статьи', range: 'A2:A' },
  ];

  fields.forEach(function(field) {
    var listItem = items.filter(function(item) {
      return item.getTitle() === field.fieldName && item.getType() === FormApp.ItemType.LIST;
    });

    if (listItem.length > 0) {
      var ss = SpreadsheetApp.openById(''); // ID таблицы
      var sheet = ss.getSheetByName(field.sheetName); // Имя листа в таблице
      var range = sheet.getRange(field.range); // Диапазон столбца с вариантами

      if (field.statusColumn) {
        var statusRange = sheet.getRange(field.statusColumn); // Диапазон столбца со статусом
        var statusValues = statusRange.getValues().flat(); // Получение всех значений статуса и "выравнивание" в одномерный массив

        var values = range.getValues().flat(); // Получение всех значений и "выравнивание" в одномерный массив
        var filteredValues = [];

        for (var i = 0; i < statusValues.length; i++) {
          if (statusValues[i] === 'Активен') {
            filteredValues.push(values[i]);
          }
        }

        var uniqueValues = [...new Set(filteredValues.filter(item => item !== '' && item !== null))].sort();
        var choices = listItem[0].asListItem().setChoiceValues(uniqueValues);
      } else {
        var values = range.getValues().flat(); // Получение всех значений и "выравнивание" в одномерный массив
        var uniqueValues = [...new Set(values.filter(item => item !== '' && item !== null))].sort();
        var choices = listItem[0].asListItem().setChoiceValues(uniqueValues);
      }
    }
  });
}


function updateFormFieldAvto() {
  var form = FormApp.getActiveForm();
  var items = form.getItems(FormApp.ItemType.LIST);
  
  // Настройки для каждого поля: название листа и диапазон значений
  var fields = [
    { fieldName: 'Авто', sheetName: 'Автомобили', range: 'A5:A', statusColumn: 'B5:B'},
  ];

  fields.forEach(function(field) {
    var listItem = items.filter(function(item) {
      return item.getTitle() === field.fieldName && item.getType() === FormApp.ItemType.LIST;
    });

    if (listItem.length > 0) {
      var ss = SpreadsheetApp.openById(''); // ID таблицы
      var sheet = ss.getSheetByName(field.sheetName); // Имя листа в таблице
      var range = sheet.getRange(field.range); // Диапазон столбца с вариантами

      if (field.statusColumn) {
        var statusRange = sheet.getRange(field.statusColumn); // Диапазон столбца со статусом
        var statusValues = statusRange.getValues().flat(); // Получение всех значений статуса и "выравнивание" в одномерный массив

        var values = range.getValues().flat(); // Получение всех значений и "выравнивание" в одномерный массив
        var filteredValues = [];

        for (var i = 0; i < statusValues.length; i++) {
          if (statusValues[i] != 'Продан') {
            filteredValues.push(values[i]);
          }
        }

        var uniqueValues = [...new Set(filteredValues.filter(item => item !== '' && item !== null))].sort();
        var choices = listItem[0].asListItem().setChoiceValues(uniqueValues);
      } else {
        var values = range.getValues().flat(); // Получение всех значений и "выравнивание" в одномерный массив
        var uniqueValues = [...new Set(values.filter(item => item !== '' && item !== null))].sort();
        var choices = listItem[0].asListItem().setChoiceValues(uniqueValues);
      }
    }
  });
}


function getActiveFormWithBackoff() {
  var MAX_ATTEMPTS = 5;
  var BASE_DELAY = 1000;  // Начальная задержка в миллисекундах
  var formId = ""; // идентификатор формы
  

  for (var attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      //var form = FormApp.getActiveForm();
      var form = FormApp.openById(formId);
      // Если удалось получить активную форму, выходим из цикла
      return form;
    } catch (error) {
      // Обработка ошибки
      console.error("Ошибка при получении активной формы:", error.message);

      // Рассчитываем задержку с использованием экспоненциальной формулы
      var delay = Math.pow(2, attempt) * BASE_DELAY;

      // Добавляем случайное значение к задержке для предотвращения синхронных запросов
      delay += Math.round(Math.random() * BASE_DELAY);

      // Задержка перед повторной попыткой
      Utilities.sleep(delay);
    }
  }

    // Если максимальное количество попыток исчерпано
    console.error("Достигнуто максимальное количество попыток при получении активной формы");
    return null;
}

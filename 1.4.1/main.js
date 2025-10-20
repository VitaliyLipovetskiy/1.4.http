function DataTable(config, data) {
    if (!config) return;
    const body = document.querySelector(config.parent);
    if (!body) return;
    body.innerHTML = '';
    const tbl = document.createElement("table");
    tbl.classList.add('datatable');
    const tblHead = document.createElement("thead");
    const tblHeadTr = document.createElement("tr");

    for (const column of config.columns) {
        const th = document.createElement("th");
        th.innerText = column.title;
        th.id = column.value;
        tblHeadTr.appendChild(th);
    }
    tblHead.appendChild(tblHeadTr);
    tbl.appendChild(tblHead);
    body.appendChild(tbl);

    if (!data && config.apiUrl) {
        fetch(config.apiUrl)
            .then(response => response.json())
            .then(json => Object.entries(json.data).map(([key, value]) => ({id: +key, ...value})))
            .then(data => buildTable(tbl, config.columns, data))
            .catch(error => console.error(error));
    }
}

const buildTable = (table, columns, data) => {
    for (const row of data) {
        const tr = getNewTr(row, columns);
        table.appendChild(tr);
    }
}

const getNewTr = (row, columns) => {
    const tr = document.createElement("tr");
    tr.id = row.id;
    for (const column of columns) {
        const td = document.createElement("td");
        if (typeof column.value === 'function') {
            td.innerHTML = column.value(row);
        } else {
            td.innerText = row[column.value];
        }
        tr.appendChild(td);
    }
    return tr;
}

const getAgeText = (number, arr) => {
    const value = number % 100;
    if (value > 4 && value < 21) return arr[2];
    const num = value % 10;
    if (num > 1 && num < 5) return arr[1];
    if (num === 1) return arr[0];
    return arr[2];
}

const getAge = (birthday) => {
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const month = today.getMonth() - birthDate.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    if (age > 0) return age + ' ' + getAgeText(age, ['людина', 'людини', 'людей']);
    const oneDay = 24 * 60 * 60 * 1000;
    age = Math.round(Math.abs((today - birthDate) / oneDay));
    if (age > 0) return age + ' ' + getAgeText(age, ['день', 'дні', 'днів']);
    const oneHour = 60 * 60 * 1000;
    age = Math.round(Math.abs((today - birthDate) / oneHour));
    return age + ' ' + getAgeText(age, ['годину', 'години', 'годин']);
}

const config1 = {
    parent: '#usersTable',
    columns: [
        {title: 'Ім’я', value: 'name'},
        {title: 'Прізвище', value: 'surname'},
        {title: 'Вік', value: (user) => getAge(user.birthday)}, // функцію getAge вам потрібно створити
        {title: 'Фото', value: (user) => `<img src="${user.avatar}" alt="${user.name} ${user.surname}"/>`},
    ],
    apiUrl: "https://mock-api.shpp.me/vitalii.lypovetsky/users"
};

DataTable(config1);

const getColorLabel = (color) => {
    return `<div class='color-container'>
        <div class='color-label' style='background-color:${color}'></div>
        <div>${color}</div>
      </div>`
}

const config2 = {
    parent: '#productsTable',
    columns: [
        {title: 'Назва', value: 'title'},
        {title: 'Ціна', value: (product) => `${product.price} ${product.currency}`},
        {title: 'Колір', value: (product) => getColorLabel(product.color)}, // функцію getColorLabel вам потрібно створити
    ],
    apiUrl: "https://mock-api.shpp.me/vitalii.lypovetsky/products"
};

DataTable(config2);
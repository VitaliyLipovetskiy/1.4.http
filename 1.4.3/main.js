function DataTable(config, data) {
    if (!config) return;
    const body = document.querySelector(config.parent);
    if (!body) return;
    body.innerHTML = '';
    const tbl = document.createElement('table');
    tbl.classList.add('datatable');

    const tblHead = document.createElement('thead');
    const tblHeadTr = document.createElement('tr');

    for (const column of config.columns) {
        const th = document.createElement('th');
        th.innerText = column.title;
        tblHeadTr.appendChild(th);
    }
    const th = document.createElement('th');
    th.innerText = 'Дії';
    tblHeadTr.appendChild(th);

    tblHead.appendChild(tblHeadTr);
    tbl.appendChild(tblHead);

    const btnAdd = document.createElement('button');
    btnAdd.innerText = 'Додати';
    btnAdd.onclick = showDialogAddNewRow(config);
    btnAdd.classList.add('add-btn');
    body.appendChild(btnAdd);
    body.appendChild(tbl);

    if (!data && config.apiUrl) {
        fetch(config.apiUrl)
            .then(response => response.json())
            .then(json => Object.entries(json.data).map(([key, value]) => ({id: +key, ...value})))
            .then(data => buildTable(tbl, config, data))
            .catch(error => console.error(error));
    }
}

const buildTable = (table, config, data) => {
    for (const row of data) {
        const tr = buildRow(config, row);
        table.appendChild(tr);
    }
}

const buildRow = (config, row) => {
    const tr = document.createElement('tr');
    for (const column of config.columns) {
        const td = document.createElement('td');
        if (typeof column.value === 'function') {
            td.innerHTML = column.value(row);
        } else {
            td.innerText = row[column.value];
        }
        tr.appendChild(td);
    }
    const td = document.createElement('td');

    const btnDelete = document.createElement('button');
    btnDelete.classList.add('delete-btn');
    btnDelete.innerText = 'Видалити';
    btnDelete.onclick = deleteRowById(config, row.id);
    td.appendChild(btnDelete);
    tr.appendChild(td);
    return tr;
}

const showDialogAddNewRow = (config) => {
    const addInput = (owner, input, value, title) => {
        let newInput = document.createElement('input');
        if (input.type === 'select') {
            newInput = document.createElement('select');
            for (const option of input.options) {
                const opt = document.createElement('option');
                opt.value = option;
                opt.innerText = option;
                newInput.appendChild(opt);
            }
        }
        newInput.type = input.type;
        if (typeof value === 'string') {
            newInput.name = value;
        } else {
            newInput.name = input.name;
        }
        if (input.required === undefined) {
            newInput.required = true;
        } else {
            newInput.required = input.required
        }
        newInput.classList.add('input-valid');
        const label = document.createElement('label');
        label.innerText = input.label || title;
        label.htmlFor = newInput.name;
        owner.appendChild(label);
        owner.appendChild(newInput);
        newInput.addEventListener('input', () => {
            newInput.classList.remove('input-invalid');
            newInput.classList.add('input-valid');
        });
    }
    return () => {
        const dialogElement = document.createElement('dialog');
        dialogElement.classList.add('responsive-form');
        const form = document.createElement('form');
        const title = document.createElement('h2');
        title.innerText = 'Новий рядок';
        form.appendChild(title);
        form.id = 'addNewElement';
        form.noValidate = true;
        for (const column of config.columns) {
            if (!column.input) continue;
            if (Array.isArray(column.input)) {
                for (const input of column.input) {
                    addInput(form, input, column.value, column.title);
                }
            } else {
                addInput(form, column.input, column.value, column.title);
            }
        }
        const btnCancel = document.createElement('button');
        btnCancel.type = 'button';
        btnCancel.innerText = 'Скасувати';
        btnCancel.onclick = closeDialogHandler;
        form.appendChild(btnCancel);

        const btnSubmit = document.createElement('button');
        btnSubmit.type = 'submit';
        btnSubmit.innerText = 'Додати';
        btnSubmit.classList.add('save-btn');
        form.appendChild(btnSubmit);
        form.addEventListener('submit', saveDataBtnClick(config), false);
        dialogElement.appendChild(form);
        dialogElement.addEventListener("keydown", (e) => {
            if (e.code === "Escape") {
                closeDialogHandler();
            }
        });
        document.body.appendChild(dialogElement);
        document.body.classList.add('scroll-lock');
        dialogElement.showModal();
    }
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

const deleteRowById = (config, id) => () => {
    if (!confirm('Ви впевнені, що хочете видалити запис?')) {
        return;
    }
    fetch(`${config.apiUrl}/${id}`, {
        method: 'DELETE',
    })
        .then(response => response.json())
        .then(json => {
            if (json.result === 'Deleted!') DataTable(config);
        })
        .catch(error => console.error(error));
}

const saveDataBtnClick = (config) => (event) => {
    event.preventDefault();
    let isValid = true;
    const inputs = event.target.elements;
    for (const input of inputs) {
        if (input.checkValidity()) {
            input.classList.remove('input-invalid');
            input.classList.add('input-valid');
        } else {
            input.classList.remove('input-valid');
            input.classList.add('input-invalid');
            isValid = false;
        }
    }
    if (!isValid) return;
    const data = [...event.target.elements]
        .filter((element) => element.type !== 'submit' && element.type !== 'button')
        .reduce((acc, element) => {
            if (element.type === 'number') {
                acc[element.name] = +element.value;
            } else {
                acc[element.name] = element.value;
            }
            return acc;
        }, {});
    // const formData = new FormData(event.target);
    // const data = Object.fromEntries(formData.entries());
    fetch(config.apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(json => {
            closeDialogHandler();
            if (json.result === 'Created!') DataTable(config);
        })
        .catch(error => console.error(error));
}

const closeDialogHandler = () => {
    document.body.classList.remove('scroll-lock');
    let dialogElement = document.querySelector('dialog');
    dialogElement.close();
    dialogElement.remove();
}

const config1 = {
    parent: '#usersTable',
    columns: [
        {
            title: 'Ім’я',
            value: 'name',
            input: {type: 'text'},
        },
        {
            title: 'Прізвище',
            value: 'surname',
            input: {type: 'text'},
        },
        {
            title: 'Вік',
            value: (user) => getAge(user.birthday),
            input: {type: 'datetime-local', name: 'birthday', label: 'Дата народження'},
        },
        {
            title: 'Фото',
            value: (user) => `<img src='${user.avatar}' alt='${user.name} ${user.surname}'/>`,
            input: {type: 'url', name: 'avatar', label: 'URL фото'},
        },
    ],
    apiUrl: 'https://mock-api.shpp.me/vitalii.lypovetsky/users',
};

DataTable(config1);

const getColorLabel = (color) => {
    return `<div class='color-container'>
        <div class='color-label' style='background-color:${color}'></div>
        <div>${color}</div>
      </div>`;
}

const config2 = {
    parent: '#productsTable',
    columns: [
        {
            title: 'Назва',
            value: 'title',
            input: {type: 'text'},
        },
        {
            title: 'Ціна',
            value: (product) => `${product.price} ${product.currency}`,
            input: [
                {type: 'number', name: 'price', label: 'Ціна'},
                {type: 'select', name: 'currency', label: 'Валюта', options: ['$', '€', '₴']},
            ],
        },
        {
            title: 'Колір',
            value: (product) => getColorLabel(product.color),
            input: {type: 'color', name: 'color'},
        }
    ],
    apiUrl: 'https://mock-api.shpp.me/vitalii.lypovetsky/products',
};

DataTable(config2);
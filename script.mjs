
// Storing neccesity information like the raw data itself (non-processed data) 
// the columns associated with the data 
// and the associated rows
let data;
let cols = [];
let rows = [];

// The tyoe of problem, [regression, classification, clustering]
let problemType;

// Storing features selected by the user for model training
// and labels too in the case of regression and classification problems
let features = [], labels = [];

// Waiting for the document to be ready
$(document).ready(() => {

    // It be responsible for handling data import, by clicking the import button
    $("#import-btn").click(() => {

        // Clearing the table in case the user click the import button more than once.
        $("#output table").html("");

        // Reading the file from the path the user selected
        let file = $("#data-path")[0].files[0];
        let reader = new FileReader();

        // Waiting for the reader to be ready
        reader.onload = function(event) {

            // Retrieving the values from the file and assign it to the data variable defined globally
            data = event.target.result;

            // Invoke a function convertDataToArr() to convert the raw data into usable format, JS Array
            // Also responsible for basic function for displaying our data
            convertDataToArr(); 

        }

        // Read our file as text
        reader.readAsText(file);
    });

    // Determine if the the dimension of our data (i.e, table) is greater than the container holding the table, if it is, make the container to be scrollable
    scrollThroughDisplayedData();

    // Initialize the event listeners

    document.querySelector("#data-path").addEventListener("change", ()=>{
        data = undefined;
        cols = [];
        rows = [];
        features = [];
        labels = [];

        $("#feature-sel div").html("");
    })

    // for filter button
    $(".filter-data button").click(apply_filter);

    $("#train-btn").click(startTraining);

    $(".reselect-feats-holder button").click(reselectFeatures);
    $(".reselect-labels-holder button").click(reselectLabels);

    // for checking if the user selects "All" from the filter selection
    document.querySelector("#filter").addEventListener("change", function(){
        if (this.value == "All") {
            $("#n").val($("#n").attr("max"));
        }
    });

    for (let selector of document.querySelectorAll(".what-problem button")) {
        selector.addEventListener("click",gotopage,true);
    }
});

function gotopage() {
    problemType = this.className;

    for (let allDetails of document.querySelectorAll("details")) {
        allDetails.style.display = "none";
    }

    $(".what-problem").hide();
    $(".main-container").show();
    $(".main-container h2").html(this.className.toUpperCase())
    $(`#${this.className}-details`).show();
}

function scrollThroughDisplayedData() {

    // Storing container's dimention [width, height]
    let output_dimention = [
        parseFloat($("#output").css("width").split("px")[0]),
        parseFloat($("#output").css("height").split("px")[0])
    ];

    // Storing table's dimention [width, height]
    let table_dimention = [
        parseFloat($("#output table").css("width").split("px")[0]),
        parseFloat($("#output table").css("height").split("px")[0])
    ];

    // Checking if the table's width is greater than the containers width,
    // if it is, make the container scrollable through the x-axis
    if (table_dimention[0] >= output_dimention[0]) {
        $("#output").css("overflow-x","scroll");
    }else {
        $("#output").css("overflow-x","hidden");
    }

    // Checking if the table's height is greater than the containers height
    // if it is, make the container scrollable through the y-axis
    if (table_dimention[1] >= output_dimention[1]) {
        $("#output").css("overflow-y","scroll");
    }else {
        $("#output").css("overflow-y","hidden");
    }
}

function convertDataToArr() {

    // defining upper limit for the filter parameter to the number of rows in the data
    $("#n").attr("max", data.split("\n").length-1);

    // Diplaying the filter container
    $(".filter-data").show();

    // Checking to see if the rows have been updated or not
    // This is checking if it has not been updated yet, to prevent re-updated it, which is not necessary at all.
    if (rows.length == 0 || cols.length == 0) {

        // This is where the rows and columns are created
        rows = data.split("\n");
        cols = rows.shift().split(",");
        cols = cols.map(col => col.trim());
    }

    displayColumnsForFeatures();

    // Creating a new variable to hold the rows to prevent modification of the row data
    var row_arr = [...rows];

    // Apply basic filtering
    row_arr = row_arr.slice(0, 5);

    // Invoke the function to display the data on a table
    displayOnTable(cols, row_arr);
}

function displayColumnsForFeatures() {
    // Checking to see if columns have been added to a container called "div" which has a parent with id "feature-sel" so that features will be added

    // if it is not added, add it, else, ignore the block of code below
    if ($(".feats-holder").html() == "") {

        $(".feats-holder").append( 
            `<div class="selection-toggler-holder">
                <p>
                    <input type="radio" name="selection-toggler" id="select-all-feats">
                    <label for="select-all-feats">Select All</label>
                </p>
                <p>
                    <input type="radio" name="selection-toggler" id="deselect-all-feats">
                    <label for="deselect-all-feats">Deselect All</label>
                </p>
                <hr>
            </div>`
        );
        $(".selection-toggler-holder").css("height","5rem");

        for (let togglerSel of document.querySelectorAll(".selection-toggler-holder input")) {
            togglerSel.addEventListener("click", toggleFeatSelection);
        }

        let feats_main_holder = document.createElement("div");
        // Iterate over the columns
        for (let col of cols) {

            // Add each column to as a child of the container holding it
            feats_main_holder.innerHTML += 
                `<p>
                    <input type="checkbox" name="feature-name" id="${col}_feature" ${features.includes(col) ? "checked" : ""}>
                    <label for="${col}_feature">${col}</label>
                </p>`;
        }
        feats_main_holder.innerHTML += 
        `
        <div class="feats-sel-btn-holder">
            <span class="warning">Please select before continuing</span>
            <abbr title="Click to select feature(s)">
                    <button id="feat-sel-btn">Select &gt;&gt;</button></abbr>
        </div>
        `
        let button_holder = feats_main_holder.children[feats_main_holder.children.length-1];
        button_holder.children[1].children[0].addEventListener("click",selectFeatures)

        feats_main_holder.className = "feats_main_holder";
        $(".feats-holder").append(feats_main_holder);

        // Then show the feature_label_selection container to be able to select features and labels (if required)
        $("#feat-label-sel").show();

        features = [];
    }
}

function displayColumnsForLabels() {
    // if it is not added, add it, else, ignore the block of code below
    if ($(".labels-holder").html() == "") {

        $(".labels-holder").append( 
            `<div class="selection-toggler-holder">
                <p>
                    <input type="radio" name="selection-toggler" id="select-all-labels">
                    <label for="select-all-labels">Select All</label>
                </p>
                <p>
                    <input type="radio" name="selection-toggler" id="deselect-all-labels">
                    <label for="deselect-all-labels">Deselect All</label>
                </p>
                <hr>
            </div>`
        );

        for (let togglerSel of document.querySelectorAll(".selection-toggler-holder input")) {
            togglerSel.addEventListener("click", toggleFeatSelection);
        }

        let cols_ = [...cols];
        cols_ = cols_.filter(val => !features.includes(val));

        let labels_main_holder = document.createElement("div");
        // Iterate over the columns
        for (let col of cols_) {

            // Add each column to as a child of the container holding it
            labels_main_holder.innerHTML += 
                `<p>
                    <input type="checkbox" name="label-name" id="${col}_label" ${labels.includes(col) ? "checked" : ""}>
                    <label for="${col}_label">${col}</label>
                </p>`;
        }
        labels_main_holder.innerHTML += 
            `
            <div class="labels-sel-btn-holder">
                <span class="warning">Please select before continuing</span>
                <abbr title="Click to select label(s)">
                        <button id="label-sel-btn">Select &gt;&gt;</button></abbr>
            </div>
            `;

        let button_holder = labels_main_holder.children[labels_main_holder.children.length-1];
        button_holder.children[1].children[0].addEventListener("click",selectLabels);

        labels_main_holder.className = "labels_main_holder";
        $(".labels-holder").append(labels_main_holder);

        labels = [];
    }
}

function toggleFeatSelection() {
    if (this.id.split("-")[0] == "select") {
        if (this.id.split("-")[2] == "feats") {
            for (let child of document.getElementsByName("feature-name")) {
                child.checked = true;
            }
        }else {
            for (let child of document.getElementsByName("label-name")) {
                child.checked = true;
            }
        }
    }else {
        if (this.id.split("-")[2] == "feats") {
            for (let child of document.getElementsByName("feature-name")) {
                child.checked = false;
            }
        }else {
            for (let child of document.getElementsByName("label-name")) {
                child.checked = false;
            }
        }
    }
}

function displayOnTable(cols_arr, row_arr) {

    // Clearing the entire table
    $("#output table").html("");
 
    // Creating a new variable to hold the rows to prevent modification of the row data
    var col_vals = [...cols_arr];
    col_vals.unshift("");

    // Creating an element for the table head and the table row holding the columns
    var thead = document.createElement("thead");
    var tr = document.createElement("tr");

    // Iterate over each column
    for (let val of col_vals) {

        // Placing each column to a cell created "th"
        var th = document.createElement("th");
        th.innerHTML = val;
        tr.append(th);
    }
    // Appending the table row to the head section of the table
    thead.append(tr);

    // Appending the table head to the table itself
    document.querySelector("#output table").append(thead);

    // Displaying the dimension of the data
    $(".dim").html(`cols: ${cols.length}<br> rows: ${rows.length}`)


    // Creating a section responsible for holding the main content of the table
    var tbody = document.createElement("tbody");

    // Iterating over each row
    for (let i=0; i<row_arr.length; i++) {

        // Taking each row and convert it to individual cell
        let row_arr_ = row_arr[i].split(",");

        // Add an index to each row
        row_arr_.unshift((rows.indexOf(row_arr[i])).toString());

        // Creating the table row for storing the row
        var tr = document.createElement("tr");

        // Iterating over each cell
        for (let val of row_arr_) {

            // Creating and placing the cell into the table row
            var td = document.createElement("td");
            td.innerHTML = val.trim();
            tr.append(td);
        }

        // Append each table row to the table body
        tbody.append(tr);
        
    }

    // Append the table body to the table itself
    document.querySelector("#output table").append(tbody);

    // Recheck to see if the table dimension has surpass that of it's container, if it does, make it scrollable
    scrollThroughDisplayedData();

    $("#train-btn").show();
}

// Invoked if a user clicked the filter button
function apply_filter() {

    // Retrieve values from the parameter provided as an input field
    let filter_choice = $("#filter").val();
    let corresponding_val = $("#n").val();

    // filter the data based on some filter provided by the user

    // Creating a new variable to hold the rows to prevent modification of the row data
    var row_arr = [...rows];

    // Check if the filter choice is "First n" or "Last n"
    if (filter_choice == "First n" || filter_choice == "Last n") {

        // If it is "First n"
        if (filter_choice == "First n") {

            // Select data from [0,val]
            row_arr = row_arr.slice(0, parseInt(corresponding_val));

        }else {     // If it is "Last n"

            // Select data from [val,length]
            row_arr = row_arr.slice(row_arr.length - parseInt(corresponding_val), row_arr.length);
        }
    }

    // Invoke the function to display the data on a table
    displayOnTable(cols, row_arr);
}

// Invoked when the user clicked the select features button
function selectFeatures() {

    // Retrieving the selected features
    for (let child of document.getElementsByName("feature-name")) {
        if (child.checked) {
            // Storing the value of the selected feature into the "features" variable already created globally, value = column_name
            features.push(child.id.split("_feature")[0]);
        }
    }
    // If nothing is selected
    if (features.length == 0) {

        // Show some error message
        $(".feats-sel-btn-holder span").show();

        // Remove the error message after 2secs
        setTimeout(()=>{$(".feats-sel-btn-holder span").hide()}, 2000);

    }else {     // If there is some selection

        // Hide the feature selection container
        $("#feature-sel").hide();

        // Display the button that will allow the user to reselect the features
        $(".reselect-feats-holder").show();

        // Show the label selection container

        displayColumnsForLabels();

        $("#label-sel").show();
    }

}

// Invoked when the user clicked the select labels button
function selectLabels() {

    // Retrieving the selected labels
    for (let child of document.getElementsByName("label-name")) {
        if (child.checked) {
            // Storing the value of the selected label into the "labels" variable already created globally, value = column_name
            labels.push(child.id.split("_label")[0]);
        }
    }

    // If nothing is selected
    if (labels.length == 0) {

        // Show some error message
        $(".labels-sel-btn-holder span").show();

        // Remove the error message after 2secs
        setTimeout(()=>{$(".labels-sel-btn-holder span").hide()}, 2000);

    }else {     // If there is some selection

        // Hide the feature selection container
        $("#label-sel").hide();

        // Display the button that will allow the user to reselect the features
        $(".reselect-labels-holder").show();

    }

}

function reselectFeatures() {
    $(".feats-holder").html("");
    $(".labels-holder").html("");

    displayColumnsForFeatures();

    // Show the feature selection container
    $("#feature-sel").show();

    // Hide the button that will allow the user to reselect the features
    $(".reselect-feats-holder").hide();

    // Hide the label selection container
    $("#label-sel").hide();

    // Hide the button that will allow the user to reselect the labels
    $(".reselect-labels-holder").hide();
}

function reselectLabels() {
    $(".labels-holder").html("");

    displayColumnsForLabels();

    // Show the label selection container
    $("#label-sel").show();

    // Hide the button that will allow the user to reselect the labels
    $(".reselect-labels-holder").hide();
}

function startTraining() {
    $(".main-container").hide();
    $(".model-train-screen").show();
    $(".model-train-screen").css({
        "display": "flex",
        "flex-direction": "column",
        "gap": "2rem"
    });
}
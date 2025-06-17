sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Column",
    "sap/m/Text",
    "sap/m/ColumnListItem"
], function (Controller, JSONModel, MessageToast, MessageBox, Column, Text, ColumnListItem) {
    "use strict";

    return Controller.extend("project1.controller.View1", {
        onInit: function () {
            const oTable = this.byId("dataTable");
            oTable.setVisible(false); // Hide table initially
        },

        onDownloadTemplate: function () {
            $.ajax({
                url: "/odata/v4/catalog/Products", // Replace with your actual OData endpoint
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                success: (data) => {
                    const results = data.d?.results || data.value || [];
                    if (!results.length) {
                        MessageToast.show("No data found to generate template.");
                        return;
                    }

                    const headers = Object.keys(results[0]);
                    const csvRows = [];

                    csvRows.push(headers.join(","));

                    results.forEach(record => {
                        const row = headers.map(header => {
                            let value = record[header];
                            if (typeof value === "string") {
                                value = `"${value.replace(/"/g, '""')}"`;
                            }
                            return value;
                        });
                        csvRows.push(row.join(","));
                    });

                    const csvContent = csvRows.join("\n");
                    const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "Products.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    MessageToast.show("CSV with all records downloaded!");
                },
                error: () => {
                    MessageToast.show("Failed to fetch OData for template.");
                }
            });
        },

        onFileChange: function (oEvent) {
            const file = oEvent.getParameter("files")[0];

            if (file && window.FileReader) {
                const reader = new FileReader();

                reader.onload = (e) => {
                    const csv = e.target.result;
                    const lines = csv.split("\n");
                    const headers = lines[0].trim().split(",");
                    const result = [];

                    let invalidName = false;
                    let invalidEmail = false;

                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (line) {
                            const values = line.split(",");
                            const record = {};
                            headers.forEach((header, index) => {
                                record[header] = values[index];
                            });

                            result.push(record);
                        }
                    }
                    const oModel = new JSONModel({ employees: result });
                    const oView = this.getView();
                    oView.setModel(oModel);

                    const oTable = oView.byId("dataTable");
                    oTable.removeAllColumns();
                    oTable.removeAllItems();

                    headers.forEach(header => {
                        oTable.addColumn(new Column({
                            header: new Text({ text: header }),
                            width: "200px"
                        }));
                    });
                    result.forEach(row => {
                        const cells = headers.map(header => new Text({ text: row[header] }));

                        const isInvalidName = row["Name"] && /\d/.test(row["Name"]);
                        const isInvalidEmail = row["Email"] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row["Email"]);

                        const listItem = new ColumnListItem({ cells });

                        if (isInvalidName || isInvalidEmail) {
                            listItem.addStyleClass("invalidRow");
                        }

                        if (isInvalidName) invalidName = true;
                        if (isInvalidEmail) invalidEmail = true;

                        oTable.addItem(listItem);
                    });
                    oTable.setVisible(true);
                    const messages = [];
                    if (invalidName) messages.push("- Name should contain only characters.");
                    if (invalidEmail) messages.push("- Email format is invalid.");

                    if (messages.length > 0) {
                        MessageBox.warning("Please correct the following:\n" + messages.join("\n"));
                    } else {
                        MessageToast.show("File uploaded and table updated!");
                    }
                };
                reader.readAsText(file);
            } else {
                MessageToast.show("This browser does not support file reading.");
            }
            
        },
            
    });
});


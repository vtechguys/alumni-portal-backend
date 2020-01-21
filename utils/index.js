'use strict'
const path = require('path');
const awsOperations = require('./aws');
const cloudinaryOperations = require('./cloudinary');
const utils = {
    aws: awsOperations,
    cloudinary: cloudinaryOperations,
    ReadCSVFile: function(filePath, exceute, callback){
        const csvParse = require('csv-parser');
        const fs = require('fs');
        
        fs.createReadStream(filePath)
          .pipe( csvParse() )
          .on('data', (data)=>{
              if(data){
                exceute(data);
              }
          })
          .on('end', ()=>{
                callback(null, 'done');
            })
    },
    ReadExcelFile: function (file, sheet_no, callback) {
        // console.log('hey');
        var excelParser = require('excel-parser');

        var file_path = path.join(__dirname, './../', './public/xlsx_files/' + file);
        // console.log(public_path);
        excelParser.parse({
            inFile: file_path,
            worksheet: sheet_no,
        }, function (err, records) {
            if (err) callback(err, null);
            callback(null, records);
        });
    },
};
module.exports = utils
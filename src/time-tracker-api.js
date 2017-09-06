"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TimeTrackerApi = (function () {
    function TimeTrackerApi() {
        var _this = this;
        this._express = null;
        this._router = null;
        this._mongodb = null;
        this._DB_PATH = 'mongodb://localhost:27017/timetrackerdb';
        this._objectId = null;
        this._express = require('express');
        this._mongodb = require('mongodb').MongoClient;
        this._objectId = require('mongodb').ObjectId;
        this._router = this._express.Router();
        this._router.post('/addcompany', function (request, response) {
            _this.addCompany(request.body.company).then(function (result) {
                response.json(result);
            }, function (error) {
                response.json(error);
            });
        });
        this._router.post('/addproject', function (request, response) {
            _this.addProject(request.body.company, request.body.project).then(function (result) {
                response.json(result);
            }, function (error) {
                response.json(error);
            });
        });
        this._router.post('/company/addentry', function (request, response) {
            _this.addEntry(request.body.company, request.body.entry).then(function (result) {
                response.json(result);
            }, function (error) {
                response.json(error);
            });
        });
        this._router.post('/company/updateentry', function (request, response) {
            _this.updateEntry(request.body.company, request.body.entry).then(function (result) {
                response.json(result);
            }, function (error) {
                response.error(error);
            });
        });
        this._router.get('/companies', function (request, response) {
            _this.getCompanies().then(function (companies) {
                response.json(companies);
            }, function (error) {
                response.json(error);
            });
        });
        this._router.get('/projects/:companyId', function (request, response) {
            _this.getProjectsByCompanyId(request.params.companyId).then(function (projects) {
                response.json(projects);
            }, function (error) {
                response.json(error);
            });
        });
        this._router.get('/company/entries/:companyId', function (request, response) {
            var companyId = request.params.companyId;
            _this.getEntriesByCompanyId(companyId).then(function (entries) {
                response.json(entries);
            }, function (error) {
                response.json(error);
            });
        });
        this._router.get('/company/:companyId/entries/:entryId/delete', function (request, response) {
            var companyId = request.params.companyId;
            var entryId = request.params.entryId;
            _this.deleteEntry(entryId, companyId).then(function (entries) {
                response.json(entries);
            }, function (error) {
                response.error(error);
            });
        });
        module.exports = this._router;
    }
    TimeTrackerApi.prototype.addCompany = function (company) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this._mongodb.connect(_this._DB_PATH, function (connectionError, db) {
                var collection = db.collection('companies');
                if (connectionError) {
                    db.close();
                    reject(connectionError);
                }
                else {
                    collection.insert({ name: company.name }).then(function (response) {
                        db.close();
                        _this.getCompanies().then(function (companies) {
                            resolve(companies);
                        });
                    }, function (error) {
                        db.close();
                        reject(error);
                    });
                }
            });
        });
    };
    TimeTrackerApi.prototype.addEntry = function (company, entry) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this._mongodb.connect(_this._DB_PATH, function (connectionError, db) {
                var collection = db.collection('entries');
                if (connectionError) {
                    db.close();
                    reject(connectionError);
                }
                else {
                    collection.insert({
                        date: entry.date,
                        project: entry.project,
                        companyId: company._id,
                        description: entry.description,
                        timeSpent: entry.timeSpent
                    }).then(function (response) {
                        db.close();
                        _this.getEntriesByCompanyId(company._id).then(function (entries) {
                            resolve(entries);
                        }, function (error) {
                            reject(error);
                        });
                    }, function (error) {
                        db.close();
                        reject(error);
                    });
                }
            });
        });
    };
    TimeTrackerApi.prototype.addProject = function (company, project) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this._mongodb.connect(_this._DB_PATH, function (connectionError, db) {
                if (connectionError) {
                    reject(connectionError);
                    db.close();
                }
                else {
                    var collection = db.collection('projects');
                    collection.insert({ companyId: company._id, name: project.name }).then(function (response) {
                        db.close();
                        _this.getProjectsByCompanyId(company._id).then(function (projects) {
                            resolve(projects);
                        }, function (error) {
                            reject(error);
                        });
                    });
                }
            });
        });
    };
    TimeTrackerApi.prototype.updateEntry = function (company, entry) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this._mongodb.connect(_this._DB_PATH, function (connectionError, db) {
                var collection = db.collection('entries');
                if (connectionError) {
                    reject(connectionError);
                    db.close();
                }
                else {
                    collection.update({
                        _id: _this._objectId(entry._id)
                    }, {
                        date: entry.date,
                        project: entry.project,
                        companyId: company._id,
                        description: entry.description,
                        timeSpent: entry.timeSpent
                    }).then(function (result) {
                        if (result) {
                            _this.getEntriesByCompanyId(company._id).then(function (_entries) {
                                resolve(_entries);
                            }, function (error) {
                                reject(error);
                            });
                        }
                    }, function (error) {
                        reject(error);
                    });
                }
            });
        });
    };
    TimeTrackerApi.prototype.getCompanies = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this._mongodb.connect(_this._DB_PATH, function (connectionError, db) {
                var collection = db.collection('companies');
                if (connectionError) {
                    reject(connectionError);
                }
                else {
                    collection.find().toArray(function (queryError, docs) {
                        if (queryError) {
                            db.close();
                            reject(queryError);
                        }
                        else {
                            db.close();
                            resolve(docs);
                        }
                    });
                }
            });
            // this._mongodb.connect(this._DB_PATH, (connectionError, db) => {
            //     if (connectionError) {
            //         reject(connectionError);
            //         db.close();
            //     } else {
            //         const collection = db.collection('companies');
            //         collection.aggregate([
            //             {
            //                 $lookup: {
            //                     from: 'projects',
            //                     localField: '_id',
            //                     foreignField: 'companyId',
            //                     as: 'projects'
            //                 }
            //             }
            //         ]).toArray( (queryError, docs) => {
            //             if (queryError) {
            //                 reject(queryError);
            //                 db.close();
            //             } else {
            //                 resolve(docs);
            //                 db.close();
            //             }
            //         });
            //     }
            // })
        });
    };
    TimeTrackerApi.prototype.getProjectsByCompanyId = function (companyId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this._mongodb.connect(_this._DB_PATH, function (connectionError, db) {
                var collection = db.collection('projects');
                if (connectionError) {
                    db.close();
                    reject(connectionError);
                }
                else {
                    collection.find({ companyId: companyId }).toArray(function (queryError, docs) {
                        resolve(docs);
                    }, function (error) {
                        reject(error);
                    });
                }
            });
        });
    };
    TimeTrackerApi.prototype.getEntriesByCompanyId = function (companyId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this._mongodb.connect(_this._DB_PATH, function (connectionError, db) {
                var collection = db.collection('entries');
                if (connectionError) {
                    db.close();
                    reject(connectionError);
                }
                else {
                    collection.find({ companyId: companyId }).toArray(function (queryError, docs) {
                        if (queryError) {
                            db.close();
                            reject(queryError);
                        }
                        else {
                            db.close();
                            resolve(docs);
                        }
                    }, function (error) {
                        db.close();
                        reject(error);
                    });
                }
            });
        });
    };
    TimeTrackerApi.prototype.deleteEntry = function (entryId, companyId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this._mongodb.connect(_this._DB_PATH, function (connectionError, db) {
                var collection = db.collection('entries');
                if (connectionError) {
                    reject(connectionError);
                    db.close();
                }
                else {
                    collection.remove({ _id: _this._objectId(entryId) }).then(function (result) {
                        if (result) {
                            _this.getEntriesByCompanyId(companyId).then(function (docs) {
                                resolve(docs);
                            }, function (error) {
                                reject(error);
                            });
                        }
                    });
                }
            });
        });
    };
    return TimeTrackerApi;
}());
exports.TimeTrackerApi = TimeTrackerApi;
new TimeTrackerApi();
//# sourceMappingURL=time-tracker-api.js.map
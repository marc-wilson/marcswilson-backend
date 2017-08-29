export class TimeTrackerApi {
    private _express: any = null;
    private _router: any = null;
    private _mongodb: any = null;
    private _DB_PATH = 'mongodb://localhost:27017/timetrackerdb';

    constructor() {
        this._express = require('express');
        this._mongodb = require('mongodb').MongoClient;
        this._router = this._express.Router();
        this._router.post('/addcompany', (request, response) => {
            this.addCompany(request.body.company).then( result => {
                response.json(result);
            }, error => {
                response.json(error);
            });
        });
        this._router.post('/addproject', (request, response) => {
            this.addProject(request.body.company, request.body.project).then( result => {
                response.json(result);
            }, error => {
                response.json(error);
            });
        });
        this._router.post('/company/addentry', (request, response) => {
            this.addEntry(request.body.company, request.body.entry).then( result => {
                response.json(result);
            }, error => {
                response.json(error);
            });
        });
        this._router.get('/companies', (request, response) => {
            this.getCompanies().then(companies => {
                response.json(companies);
            }, error => {
                response.json(error);
            });
        });
        this._router.get('/projects/:companyId', (request, response) => {
            this.getProjectsByCompanyId(request.params.companyId).then(projects => {
                response.json(projects);
            }, error => {
                response.json(error);
            });
        });
        this._router.get('/company/entries/:companyId', (request, response) => {
            const companyId = request.params.companyId;
            this.getEntriesByCompanyId(companyId).then( entries => {
                response.json(entries);
            }, error => {
                response.json(error);
            });
        });

        module.exports = this._router;
    }
    addCompany(company): Promise<Array<any>> {
        return new Promise( (resolve, reject) => {
            this._mongodb.connect(this._DB_PATH, (connectionError, db) => {
                const collection = db.collection('companies');
                if (connectionError) {
                    db.close();
                    reject(connectionError);
                } else {
                    collection.insert({ name: company.name }).then( response => {
                        db.close();
                        this.getCompanies().then( companies => {
                            resolve(companies);
                        });
                    }, error => {
                        db.close();
                        reject(error);
                    });
                }
            });
        });
    }
    addEntry(company, entry): Promise<any> {
        return new Promise( (resolve, reject) => {
            this._mongodb.connect(this._DB_PATH, (connectionError, db) => {
                const collection = db.collection('entries');
                if (connectionError) {
                    db.close();
                    reject(connectionError);
                } else {
                    collection.insert({
                        date: entry.date,
                        project: entry.project,
                        companyId: company._id,
                        description: entry.description,
                        timeSpent: entry.timeSpent
                    }).then( response => {
                        db.close();
                        resolve(response);
                    }, error => {
                        db.close();
                        reject(error);
                    });
                }
            });
        });
    }
    addProject(company, project): Promise<any> {
        return new Promise( (resolve, reject) => {
            this._mongodb.connect(this._DB_PATH, (connectionError, db) => {
                if (connectionError) {
                    reject(connectionError);
                    db.close();
                } else {
                    const collection = db.collection('projects');
                    collection.insert({companyId: company._id, name: project.name}).then( response => {
                        db.close();
                        this.getProjectsByCompanyId(company._id).then( projects => {
                            resolve(projects);
                        }, error => {
                            reject(error);
                        });
                    });
                }
            });
        });
    }
    getCompanies(): Promise<Array<any>> {
        return new Promise( (resolve, reject) => {
            this._mongodb.connect(this._DB_PATH, (connectionError, db) => {
                const collection = db.collection('companies');
                if (connectionError) {
                    reject(connectionError);
                } else {
                    collection.find().toArray( (queryError, docs) => {
                        if (queryError) {
                            db.close();
                            reject(queryError);
                        } else {
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
    }
    getProjectsByCompanyId(companyId): Promise<any> {
        return new Promise( (resolve, reject) => {
            this._mongodb.connect(this._DB_PATH, (connectionError, db) => {
                const collection = db.collection('projects');
                if (connectionError) {
                    db.close();
                    reject(connectionError);
                } else {
                    collection.find({ companyId: companyId }).toArray( (queryError, docs) => {
                        resolve(docs);
                    }, error => {
                        reject(error);
                    });
                }
            });
        });
    }
    getEntriesByCompanyId(companyId): Promise<any> {
        return new Promise( (resolve, reject) => {
            this._mongodb.connect(this._DB_PATH, (connectionError, db) => {
                const collection = db.collection('entries');
                if (connectionError) {
                    db.close();
                    reject(connectionError);
                } else {
                    collection.find({ companyId: companyId}).toArray( (queryError, docs) => {
                        if (queryError) {
                            db.close();
                            reject(queryError);
                        } else {
                            db.close();
                            resolve(docs);
                        }
                    }, error => {
                        db.close();
                        reject(error);
                    });
                }
            });
        });
    }
}

new TimeTrackerApi();

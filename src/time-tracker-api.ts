export class TimeTrackerApi {
    private _express: any = null;
    private _router: any = null;
    private _mongodb: any = null;
    private _DB_PATH = 'mongodb://localhost:27017/timetrackerdb';
    private _objectId: any = null;

    constructor() {
        this._express = require('express');
        this._mongodb = require('mongodb').MongoClient;
        this._objectId = require('mongodb').ObjectId;
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
        this._router.post('/company/updateentry', (request, response) => {
            this.updateEntry(request.body.company, request.body.entry).then( result => {
                response.json(result);
            }, error => {
                response.error(error);
            });
        });
        this._router.post('/entries/getentriesbydaterange', (request, response) => {
            const start = new Date(request.body.start);
            start.setHours(0, 0, 0, 0);
            const end = new Date(request.body.end);
            end.setHours(0, 0, 0, 0);
            const userId = request.body.userId;
           this.getEntriesByDateRange(start, end, userId).then( entries => {
               response.json(entries);
           }, error => {
               response.error(error);
           })
        });
        this._router.post('/entries/getentriesbycompanyid', (request, response) => {
           const start = new Date(request.body.start);
           start.setHours(0, 0, 0, 0);
           const end = new Date(request.body.end);
           end.setHours(0, 0, 0, 0);
           const companyId = request.body.companyId;
           this.getEntriesByCompanyIdAndDateRange(start, end, companyId).then( entries => {
               response.json(entries);
           }, error => {
               response.error(error);
           })
        });
        this._router.get('/companies/:userId', (request, response) => {
            this.getCompanies(request.params.userId).then(companies => {
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
        this._router.get('/company/:companyId/entries/:entryId/delete', (request, response) => {
            const companyId = request.params.companyId;
            const entryId = request.params.entryId;
            this.deleteEntry(entryId, companyId).then( entries => {
                response.json(entries);
            }, error => {
                response.error(error);
            })
        });
        this._router.post('/invoice/addinvoice', (request, response) => {
            const invoice = request.body.invoice;
            this.addInvoice(invoice).then( result => {
                response.json(result);
            }, error => {
                response.error(error);
            });
        });
        this._router.get('/invoice/invoices/:userId', (request, response) => {
            const userId = request.params.userId;
            this.getInvoices(userId).then( invoices => {
                response.json(invoices);
            }, error => {
                response.error(error);
            });
        });
        this._router.get('/invoice/export/:invoiceId', (request, response) => {
            const invoiceId = request.params.invoiceId;
            this.exportInvoice(invoiceId).then( _invoice => {
                response.json(_invoice);
            }, error => {
                response.error(error);
            })
        })
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
                    collection.insert({ name: company.name, userId: company.userId }).then( response => {
                        db.close();
                        this.getCompanies(company.userId).then( companies => {
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
                        timeSpent: entry.timeSpent,
                        userId: entry.userId
                    }).then( response => {
                        db.close();
                        this.getEntriesByCompanyId(company._id).then( entries => {
                            resolve(entries);
                        }, error => {
                            reject(error);
                        });
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
    addInvoice(invoice): Promise<any> {
        return new Promise( (resolve, reject) => {
            this._mongodb.connect(this._DB_PATH, (connectionError, db) => {
                if (connectionError) {
                    db.close();
                    reject(connectionError);
                } else {
                    const collection = db.collection('invoices');
                    collection.insert({
                        company: invoice.company,
                        companyId: invoice.company._id,
                        userId: invoice.userId,
                        entries: invoice.entries,
                        billRate: invoice.billRate,
                        totalHours: invoice.totalHours,
                        totalCompensation: invoice.totalCompensation,
                        invoiceMonth: invoice.invoiceMonth,
                        invoiceYear: invoice.invoiceYear,
                        invoiceDate: invoice.invoiceDate,
                        invoiceDueDate: invoice.invoiceDueDate
                    }).then( response => {
                        resolve(response);
                    }, error => {
                        reject(error);
                    })
                }
            });
        });
    }
    getInvoices(userId): Promise<any> {
        return new Promise( (resolve, reject) => {
            this._mongodb.connect(this._DB_PATH, (connectionError, db) => {
                if (connectionError) {
                    reject(connectionError);
                    db.close();
                } else {
                    const collection = db.collection('invoices');
                    collection.find({userId: userId}).toArray( (queryError, docs) => {
                        if (queryError) {
                            reject(queryError);
                            db.close();
                        } else {
                            resolve(docs);
                            db.close();
                        }
                    })
                }
            });
        })
    }
    getInvoiceById(invoiceId: string): Promise<any> {
        return new Promise( (resolve, reject) => {
            this._mongodb.connect(this._DB_PATH, (connectionError, db) => {
                if (connectionError) {
                    reject(connectionError);
                    db.close();
                } else {
                    const collection = db.collection('invoices');
                    collection.find({_id: this._objectId(invoiceId)}).toArray( (queryError, docs) => {
                        if (queryError) {
                            reject(queryError);
                            db.close();
                        } else {
                            resolve(docs);
                        }
                    })
                }
            })
        })
    }
    exportInvoice(invoiceId: string): Promise<any> {
        return new Promise( (resolve, reject) => {
            this.getInvoiceById(invoiceId).then( docs => {
                if (docs) {
                    resolve(docs);
                }
            }, error => {
                reject(error);
            })
        })
    }
    updateEntry(company, entry): Promise<any> {
        return new Promise( (resolve, reject) => {
            this._mongodb.connect(this._DB_PATH, (connectionError, db) => {
                const collection = db.collection('entries');
                if (connectionError) {
                    reject(connectionError);
                    db.close();
                } else {
                    collection.update(
                        {
                            _id: this._objectId(entry._id)
                        },
                        {
                            date: entry.date,
                            project: entry.project,
                            companyId: company._id,
                            description: entry.description,
                            timeSpent: entry.timeSpent
                        }
                    ).then( result => {
                        if (result) {
                            this.getEntriesByCompanyId(company._id).then( _entries => {
                                resolve(_entries);
                            }, error => {
                                reject(error);
                            });
                        }
                    }, error => {
                        reject(error);
                    })
                }
            })
        });
    }
    getCompanies(userId): Promise<Array<any>> {
        return new Promise( (resolve, reject) => {
            this._mongodb.connect(this._DB_PATH, (connectionError, db) => {
                const collection = db.collection('companies');
                if (connectionError) {
                    reject(connectionError);
                } else {
                    collection.find( { userId: userId }).toArray( (queryError, docs) => {
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
    getEntriesByDateRange(start: Date, end: Date, userId: string): Promise<Array<any>> {
        return new Promise( (resolve, reject) => {
           this._mongodb.connect(this._DB_PATH, (connectionError, db) => {
               const collection = db.collection('entries');
               if (connectionError) {
                   db.close();
                   reject(connectionError);
               } else {
                   collection.find({
                       $and: [
                           {
                               date: {
                                   $gte: start.toISOString()
                               }
                           },
                           {
                               date: {
                                   $lte: end.toISOString()
                               }
                           },
                           {
                               userId: userId
                           }
                       ]
                   }).toArray( (queryError, docs) => {
                      if (queryError) {
                          db.close();
                          reject(queryError);
                      }  else {
                          db.close();
                          resolve(docs);
                      }
                   }, error => {
                       db.close();
                       reject(error);
                   });
               }
           })
        });
    }
    getEntriesByCompanyIdAndDateRange(start: Date, end: Date, companyId: string): Promise<Array<any>> {
        return new Promise( (resolve, reject) => {
            this._mongodb.connect(this._DB_PATH, (connectionError, db) => {
                const collection = db.collection('entries');
                if (connectionError) {
                    db.close();
                    reject(connectionError);
                } else {
                    collection.find({
                        $and: [
                            {
                                date: {
                                    $gte: start.toISOString()
                                }
                            },
                            {
                                date: {
                                    $lte: end.toISOString()
                                }
                            },
                            {
                                companyId: companyId
                            }
                        ]
                    }).toArray( (queryError, docs) => {
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
            })
        });
    }
    deleteEntry(entryId: string, companyId: string): Promise<any> {
        return new Promise( (resolve, reject) => {
            this._mongodb.connect(this._DB_PATH, (connectionError, db) => {
                const collection = db.collection('entries');
                if (connectionError) {
                    reject(connectionError);
                    db.close();
                } else {
                    collection.remove({_id: this._objectId(entryId)}).then( result => {
                        if (result) {
                            this.getEntriesByCompanyId(companyId).then( docs => {
                                resolve(docs);
                            }, error => {
                                reject(error);
                            })
                        }
                    })
                }
            })
        });
    }
}

new TimeTrackerApi();

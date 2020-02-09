class ContractModel {
    constructor(contract) {
        Object.assign(this, contract);
    }

    total() {
        return this.loads.reduce((acc, load) => acc + (load.quantity ? load.quantity : 0), 0);
    }

    siteDone(site) {
        return this.events.some(e => e.site === site && (e.type === 'LoadingComplete' || e.type === 'UnloadingComplete'));
    }

    activeSite() {
        const sites = ['pickup', 'delivery'];
        return sites.find(site => !this.siteDone(site));
    }

    names() {
        const result = this.events
            .filter(e => e.type === 'AssignDriver' && e.assignedDriver)
            .reduce((map, obj) => {
                map[obj.assignedDriver.username] = obj.assignedDriver.name;
                return map;
            }, {});
        if (this.creator) {
            result[this.owner] = this.creator.name;
        }
        return result;
    }
}

export default ContractModel;
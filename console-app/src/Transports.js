import {Component} from "react";
import React from "react";
import {Header, Button, Dimmer, Form, Grid, Icon, Loader, Menu, Progress, Segment, Table} from "semantic-ui-react";
import {Link} from "react-router-dom";
import * as queries from "./graphql/queries";
import {API, Auth, graphqlOperation, I18n} from 'aws-amplify';
import moment from 'moment/min/moment-with-locales';
import {ContactPicker, DriverPicker} from "./NewTransport";
import ReactGA from "react-ga";
import {trackEvent} from "./ConsoleUtils";

const AddressCell = ({address}) => {
    return (
        <Table.Cell verticalAlign="top" width="1">
            <div className="no-wrap">{address.name}</div>
            <div className="no-wrap">{address.postalCode} {address.city}</div>
        </Table.Cell>
    )
};

const ConsignmentCell = ({loads}) => {
    return (
        <Table.Cell verticalAlign="top" width="3">
            {loads.map((e) => [e.quantity, I18n.get(e.category), e.description].join(" ")).join(" ")}
        </Table.Cell>
    )
};

const TextCell = ({text}) => {
    return (
        <Table.Cell width="1" verticalAlign="top">{text}</Table.Cell>
    )
};

const IdCell = ({id}) => {
    const text = id.substring(0, 8);
    return (
        <Table.Cell width="1" verticalAlign="top">
            <Link to={`/transports/${id}`}>{text}</Link>
        </Table.Cell>
    )
};

const DateCell = ({date, showTime}) => (
    <Table.Cell width={"1"} verticalAlign={"top"} style={{whiteSpace: "nowrap"}} textAlign={'right'}>
        {moment(date).format('ll')}
        {showTime && <br/>}
        {showTime && moment(date).format('LTS')}
    </Table.Cell>
);

const StatusMappings = () => ({
    DRAFT: {
        progress: 0,
        label: I18n.get('draft'),
        color: 'grey'
    },
    CREATED: {
        progress: 33,
        label: I18n.get('created'),
        color: 'blue'
    },
    IN_PROGRESS: {
        progress: 66,
        label: I18n.get('ongoing'),
        color: 'orange'
    },
    DONE: {
        progress: 100,
        label: I18n.get('done'),
        color: 'green'
    },
    ARCHIVED: {
        progress: 100,
        label: I18n.get('archived'),
        color: 'grey'
    }
});

const Status = ({status, updatedAt}) => {
    const statusMapping = StatusMappings()[status];
    return <Table.Cell width={1}>
        <Progress percent={statusMapping.progress} size={'tiny'} color={statusMapping.color}>
        </Progress>
        <div style={{whiteSpace: "nowrap", marginTop: -30, textAlign: "center", fontWeight: "bold", fontSize: "x-small"}}>{statusMapping.label}</div>
    </Table.Cell>
};

class Transports extends Component {
    constructor(props) {
        super(props);

        this.state = {
            notes: [],
            loading: true,
            previousTokens: [],
            nextToken: null,
            sort: "pickupDate",
            sortOrder: "descending",
            lastChangeFrom: "",
            lastChangeTo: "",
            pickupFrom: "",
            pickupTo: ""
        };

        this.onNext = this.onNext.bind(this);
        this.onPrev = this.onPrev.bind(this);
        this.refresh = this.refresh.bind(this);
        this.handleFiltersInput = this.handleFiltersInput.bind(this);
        this.applyFilters = this.applyFilters.bind(this);
        this.clearFilters = this.clearFilters.bind(this);
        this.toggleFilters = this.toggleFilters.bind(this);
    }

    handleFiltersInput(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;
        this.setState({
            [name]: value
        });
    }

    toggleFilters() {
        if (this.state.filters) {
            this.clearFilters();
        }
        this.setState({filters: !this.state.filters});
    }

    render() {
        const cols = 10;
        const filterLastChange = !!(this.state.lastChangeFrom || this.state.lastChangeTo);
        const filterPickup = !!(this.state.pickupFrom || this.state.pickupTo);
        return (

            <Table className="App-text-with-newlines" selectable compact='very' sortable columns={cols} fixed>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell colSpan={cols}>
                            <Link to={"/transports-new"}>
                                <Button floated='right' icon labelPosition='left' primary size='small'>
                                    <Icon name='plus'/> {I18n.get('New transport')}
                                </Button>
                            </Link>
                            <Button floated={'right'} active={this.state.filters} icon
                                    onClick={this.toggleFilters} color={"olive"} labelPosition={'left'} size={'small'}>
                                <Icon name='filter'/> {I18n.get('Filters')}
                            </Button>
                            <Menu pagination>
                                <Menu.Item as='a' icon onClick={this.onPrev} disabled={!this.state.currentPageToken}>
                                    <Icon name='chevron left' />
                                </Menu.Item>
                                <Menu.Item as='a' icon onClick={this.onNext} disabled={!this.state.nextToken}>
                                    <Icon name='chevron right' />
                                </Menu.Item>
                                <Menu.Item as='a' icon onClick={this.refresh}>
                                    <Icon name='refresh' />
                                </Menu.Item>
                            </Menu>
                            {this.state.filters && <Segment padded compact size={"tiny"} color={"olive"}>
                                <Form>
                                    <Form.Group>
                                        <Form.Input value={this.state.lastChangeFrom} disabled={filterPickup}
                                                    size={"mini"} label={I18n.get("Last changed from")}
                                                    onChange={this.handleFiltersInput} name="lastChangeFrom" type={'date'}/>
                                        <Form.Input value={this.state.lastChangeTo} disabled={filterPickup}
                                                    size={"mini"} label={I18n.get("Last changed to")}
                                                    onChange={this.handleFiltersInput} name="lastChangeTo" type={'date'} />

                                        <Form.Input value={this.state.pickupFrom} disabled={filterLastChange}
                                                    size={"mini"} label={I18n.get("Pickup date from")}
                                                    onChange={this.handleFiltersInput} name="pickupFrom" type={'date'} />
                                        <Form.Input value={this.state.pickupTo} disabled={filterLastChange}
                                                    size={"mini"} label={I18n.get("Pickup date to")}
                                                    onChange={this.handleFiltersInput} name="pickupTo" type={'date'} />
                                    </Form.Group>
                                    <Button floated={"right"} primary positive onClick={this.applyFilters}>Apply</Button>
                                    <Button floated={"right"} secondary onClick={this.clearFilters}>Clear</Button>
                                </Form>
                            </Segment>}
                        </Table.HeaderCell>
                    </Table.Row>
                    <Table.Row>
                        <Table.HeaderCell>{I18n.get('Number')}</Table.HeaderCell>
                        <Table.HeaderCell>{I18n.get('Status')}</Table.HeaderCell>
                        <Table.HeaderCell>{I18n.get('Pick-up address')}</Table.HeaderCell>
                        <Table.HeaderCell className={"sort"} onClick={() => this.changeSort('pickupDate')} sorted={this.state.sort === 'pickupDate' && this.state.sortOrder}>{I18n.get('Pick-up date')}</Table.HeaderCell>
                        <Table.HeaderCell>{I18n.get('Delivery address')}</Table.HeaderCell>
                        <Table.HeaderCell>{I18n.get('Delivery date')}</Table.HeaderCell>
                        <Table.HeaderCell className={"sort"} onClick={() => this.changeSort('updatedAt')} sorted={this.state.sort === 'updatedAt' && this.state.sortOrder}>{I18n.get('Last change')}</Table.HeaderCell>
                        <Table.HeaderCell>{I18n.get('Shipper')}</Table.HeaderCell>
                        <Table.HeaderCell>{I18n.get('Driver')}</Table.HeaderCell>
                        <Table.HeaderCell>{I18n.get('Loads')}</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>

                    {!this.state.loading && this.renderConsignmentNotes()}
                    {!this.state.loading && this.state.notes.length === 0 && !this.state.currentPageToken &&
                        <Table.Row>
                            <Table.Cell colSpan={'10'} textAlign={"center"} selectable={false}>
                                <div style={{padding: '50px', paddingTop: '200px', minHeight: '560px'}}>
                                    <p>
                                        {I18n.get('No transports found, please create one using the button above.')}
                                    </p>
                                    <Icon name={"shipping fast"} size={"massive"}/>
                                </div>
                            </Table.Cell>
                        </Table.Row>
                    }
                    {this.state.loading &&
                        <Table.Row>
                            <Table.Cell colSpan={cols} textAlign={"center"} selectable={false}>
                                <Loader active={true} inline size={"large"}/>
                            </Table.Cell>
                        </Table.Row>
                    }
                </Table.Body>
                <Table.Footer>
                    <Table.Row>
                        <Table.HeaderCell colSpan={cols}>
                            <Menu floated='right' pagination>
                                <Menu.Item as='a' icon onClick={this.onPrev} disabled={!this.state.currentPageToken}>
                                    <Icon name='chevron left' />
                                </Menu.Item>
                                <Menu.Item as='a' icon onClick={this.onNext} disabled={!this.state.nextToken}>
                                    <Icon name='chevron right' />
                                </Menu.Item>
                            </Menu>
                        </Table.HeaderCell>
                    </Table.Row>
                </Table.Footer>
            </Table>
        );
    }

    renderConsignmentNotes() {
        return (
            this.state.notes.map((e) =>
                <Table.Row key={e.id}>
                    {/*<TextCell text={moment(e.updatedAt).format("ll")}/>*/}
                    <IdCell id={e.id}/>
                    <Status status={e.status} lastUpdate={e.updatedAt}/>
                    <AddressCell address={e.pickup}/>
                    <DateCell date={e.arrivalDate}/>
                    <AddressCell address={e.delivery}/>
                    <DateCell date={e.deliveryDate}/>
                    <DateCell date={e.updatedAt} showTime/>
                    <AddressCell address={e.shipper}/>
                    <TextCell text={e.driver ? e.driver.name : null}/>
                    <ConsignmentCell loads={e.loads}/>
                </Table.Row>
            )
        )
    }

    clearFilters() {
        this.setState({
            pickupTo: "",
            pickupFrom: "",
            lastChangeTo: "",
            lastChangeFrom: ""
        });
        this.retrieveAppSync();
    }

    componentDidMount() {
        this.retrieveAppSync();
    }

    applyFilters() {
        this.retrieveAppSync();
    }

    async retrieveAppSync(token) {
        const {sort} = this.state;
        this.setState({
            loading: true
        });
        const user = await Auth.currentAuthenticatedUser();

        let key;
        let filterParam = {};

        const {lastChangeFrom, lastChangeTo, pickupFrom, pickupTo} = this.state;
        if (lastChangeFrom || lastChangeTo) {
            trackEvent({
                category: "transports",
                action: "filter",
                label: "filter_by_last_change"
            });

            key = 'contractsByOwnerUpdatedAt';

            if (lastChangeFrom && lastChangeTo) {
                filterParam.updatedAt = {
                    between: [lastChangeFrom, lastChangeTo]
                };
            } else if (lastChangeFrom) {
                filterParam.updatedAt = {
                    ge: lastChangeFrom
                };
            } else {
                filterParam.updatedAt = {
                    le: lastChangeTo
                };
            }
            this.setState({
                sort: 'updatedAt'
            })
        } else if (pickupFrom || pickupTo) {
            key = 'contractsByOwnerArrivalDate';

            trackEvent({
                category: "transports",
                action: "filter",
                label: "filter_by_arrival_date"
            })

            if (pickupFrom && pickupTo) {
                filterParam.arrivalDate = {
                    between: [pickupFrom, pickupTo]
                };
            } else if (pickupFrom) {
                filterParam.arrivalDate = {
                    ge: pickupFrom
                };
            } else {
                filterParam.arrivalDate = {
                    le: pickupTo
                };
            }
            this.setState({
                sort: 'pickupDate'
            })
        } else {
            key = sort === 'pickupDate' ? 'contractsByOwnerArrivalDate' : 'contractsByOwnerUpdatedAt';
        }

        const response = await API.graphql(graphqlOperation(
            queries[key], {
                limit: 10,
                owner: user.getUsername(),
                sortDirection: this.state.sortOrder === 'descending' ? "DESC" : "ASC",
                ...token && {nextToken: token},
                ...filterParam
            }));

        const nextToken = response.data[key].nextToken;
        this.setState({
            nextToken: nextToken,
            notes: response.data[key].items,
            loading: false
        });
    }

    onNext() {
        if (this.state.currentPageToken) {
            const previousTokens = [...this.state.previousTokens];
            previousTokens.push(this.state.currentPageToken);
            this.setState({
                previousTokens
            });
        }
        this.setState({
            currentPageToken: this.state.nextToken
        });

        this.retrieveAppSync(this.state.nextToken)
    }

    refresh() {
        this.retrieveAppSync(this.state.currentPageToken);
    }

    onPrev() {
        const {previousTokens} = this.state;
        const previousToken = previousTokens[previousTokens.length - 1];
        this.setState({
            previousTokens: previousTokens.slice(0, previousTokens.length - 1),
            currentPageToken: previousToken
        });
        this.retrieveAppSync(previousToken);
    }

    changeSort(newSort) {
        const {sort} = this.state;

        let sortOrder;
        if (newSort === sort) {
            sortOrder = this.state.sortOrder === 'ascending' ? 'descending' : 'ascending'
        } else {
            sortOrder = 'descending';
        }

        this.setState({
            sortOrder,
            sort: newSort,
            previousTokens: [],
            nextToken: null,
            currentPageToken: null
        }, () => {
            this.retrieveAppSync()
        });
    }
}

export default Transports;
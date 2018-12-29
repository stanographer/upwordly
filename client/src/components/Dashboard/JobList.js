import React from 'react';
import { Link } from 'react-router-dom';
import { withFirebase } from '../Firebase';
import {
  Card,
  CardBody,
  CardHeader,
  DropdownMenu,
  DropdownItem,
  DropdownToggle,
  FormGroup,
  Input,
  Label,
  Table,
  UncontrolledDropdown,
  UncontrolledTooltip
} from 'reactstrap';

class JobList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      jobs: [],
      jobsToDelete: [],
      loading: true
    };

    this.handleJobCheck = this.handleJobCheck.bind(this);
    this.deleteJobs = this.deleteJobs.bind(this);
  }

  componentDidMount() {
    const { firebase } = this.props;

    firebase.allJobsList().on('value', snapshot => {
      const jobs = snapshot.val();

      if (!jobs) {
        this.setState({
          loading: false
        });
        return;
      }

      let jobsList = Object.keys(jobs).map(key => ({
        ...jobs[key],
        uid: key
      })).reverse();

      // There must be a better way to do this instead of re-traversing the
      // returned array and assigning the snippets to it.
      jobsList.forEach(job => {
        const url = process.env.REACT_APP_ENV === 'dev'
          ? `${ window.location.protocol }//${ window.location.hostname }:${ process.env.REACT_APP_HTTP_PORT }`
          : `${ window.location.protocol }//${ window.location.hostname }`;

        fetch(`${ url }/api/snippet?user=${ job.username }&job=${ job.slug }`, {
          method: 'get',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }).then(response => response.text()).then(snapshot => {
          job.snippet = snapshot ? snapshot + '...' : '';
        }).then(() => {
          this.setState({
            jobs: jobsList,
            loading: false
          });
        }).catch(() => {
          this.setState({
            jobs: jobsList,
            loading: false
          });
        });
      });
    });
  }

  componentWillUnmount() {
    this.props.firebase.allJobs().off();
  }

  handleJobCheck(e) {
    const { jobsToDelete } = this.state;

    if (e.target.type === 'checkbox' && e.target.checked) {
      if (!this.state.jobsToDelete || !jobsToDelete.includes(e.target.name)) {
        this.setState({
          jobsToDelete: [...jobsToDelete, e.target.name]
        }, () => {
          console.log('added', this.state.jobsToDelete);
        });
      } else {
        this.setState({
          jobsToDelete: this.state.jobsToDelete.filter(job => job !== e.target.name)
        }, () => {
          console.log('removed', this.state.jobsToDelete);
        });
      }
    }
  }

  deleteJobs() {
    const { firebase } = this.props;
    const { jobsToDelete } = this.state;

    jobsToDelete.forEach(job => {
      firebase.deleteJobFromJobs(job.uid);
      firebase.deleteJobFromUser(job.slug);
      this.deleteShareDbJob(job.username, job.slug);
    });
  }

  deleteShareDbJob(user, job) {
    const url = `${ window.location.protocol }//${ window.location.hostname }`;
    return fetch(`${ url }/api?user=${ user }&job=${ job }`, {
      method: 'delete'
    }).then(response => response.json());
  }

  render() {
    const { jobs, loading } = this.state;

    return (
      <div>
        { !loading
          ? <Card className="card-tasks">
            <CardHeader>
              <h4 className="title d-inline text-primary">REPOSITORY</h4>
              {/*<p className="card-category d-inline"> today</p>*/ }
              <UncontrolledDropdown>
                <DropdownToggle
                  caret
                  className="btn-icon"
                  color="link"
                  data-toggle="dropdown"
                  type="button"
                >
                  <i className="tim-icons icon-settings-gear-63" />
                </DropdownToggle>
                <DropdownMenu aria-labelledby="dropdownMenuLink" right>
                  <DropdownItem
                    href="#pablo"
                    onClick={ e => e.preventDefault() }
                  >
                    Action
                  </DropdownItem>
                  <DropdownItem
                    href="#pablo"
                    onClick={ e => e.preventDefault() }
                  >
                    Another action
                  </DropdownItem>
                  <DropdownItem
                    href="#pablo"
                    onClick={ e => e.preventDefault() }
                  >
                    Something else
                  </DropdownItem>
                </DropdownMenu>
              </UncontrolledDropdown>
            </CardHeader>
            <CardBody>
              <div className="table-full-width table-responsive">
                <Table>
                  <tbody>
                  <ListOfJobs
                    handleJobCheck={ this.handleJobCheck }
                    jobs={ jobs }
                    hidden={ !jobs || jobs.length === 0 } />
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
          : <p className="text-center"><em>Loading...</em></p>
        }
      </div>
    );
  }
}

const ListOfJobs = ({ handleJobCheck, jobs }) =>
  <>
    { !!jobs && jobs.map(job => (
      <tr key={ job.uid }>
        <td>
          <FormGroup check>
            <Label check>
              <Input
                key={ job.uid }
                name={`${job.uid}, ${job.slug}, ${job.username}`}
                type="checkbox"
                onClick={ e => handleJobCheck(e) } />
              <span className="form-check-sign">
                <span className="check" />
                </span>
            </Label>
          </FormGroup>
        </td>
        <td>
          <p className="title text-info">{ job.title ? job.title : job.slug }</p>
          <p className="small text-muted">{ new Date(job.timeCreated).toLocaleString() }</p>
          <p>
            { job.snippet ? job.snippet : <em>This job has no preview.</em> }
          </p>
        </td>
        <td className="td-actions text-right">
          <Link
            color="link"
            id="tooltip636901683"
            title=""
            type="button"
            to={ `/editor?user=${ job.username }&job=${ job.slug }` }>
            <i className="tim-icons icon-pencil" />
          </Link>
          <UncontrolledTooltip
            delay={ 0 }
            target="tooltip636901683"
            placement="right"
          >
            Edit Job
          </UncontrolledTooltip>
        </td>
      </tr>
    )) }
  </>;

{/*{ !!jobs && jobs.map(job => (*/
}
{/*<tr key={ job.uid }>*/
}
{/*<th scope="row">1</th>*/
}
{/*<td>{ job.slug }</td>*/
}
{/*<td>{ job.title }</td>*/
}
{/*<td>{ job.timeCreated }</td>*/
}
{/*<td>{ job.viewCount }</td>*/
}
{/*<td>*/
}
{/*<a*/
}
{/*href={ `${ window.location.protocol }//${ window.location.host }/editor?user=${ job.username }&job=${ job.slug }` }>*/
}
{/*Edit*/
}
{/*</a>*/
}
{/*<br />*/
}
{/*<a href={ `${ window.location.protocol }//${ window.location.host }/${ job.username }/${ job.slug }` }*/
}
{/*target="_blank">Open in new window</a>*/
}
{/*<br />*/
}
{/*<a href="#" onClick={() => {*/
}
{/*firebase.deleteJobFromJobs(job.uid);*/
}
{/*firebase.deleteJobFromUser(job.slug);*/
}
{/*this.deleteShareDbJob(job.username, job.slug)*/
}
{/*}}>Delete</a>*/
}
{/*</td>*/
}
{/*</tr>*/
}
{/*)) }*/
}

JobList.propTypes = {};

export default withFirebase(JobList);

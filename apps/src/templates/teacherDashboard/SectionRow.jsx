import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import i18n from '@cdo/locale';
import ProgressButton from '@cdo/apps/templates/progress/ProgressButton';
import { sectionShape, assignmentShape } from './shapes';
import PrintCertificates from './PrintCertificates';
import {
  assignmentNames,
  assignmentPaths,
  updateSection,
  removeSection
} from './teacherSectionsRedux';
import { SectionLoginType } from '@cdo/apps/util/sharedConstants';
import { styles as tableStyles } from '@cdo/apps/templates/studioHomepages/SectionsTable';

const styles = {
  link: tableStyles.link,
  col: tableStyles.col,
  courseCol: {
    minWidth: 200,
  },
  lightRow: tableStyles.lightRow,
  darkRow: tableStyles.darkRow,
  row: tableStyles.row,
  rightButton: {
    marginLeft: 5
  },
  nowrap: {
    whiteSpace: 'nowrap'
  },
  currentUnit: {
    marginTop: 10
  }
};

/**
 * Our base buttons (Edit and delete).
 */
export const EditOrDelete = ({canDelete, onEdit, onDelete}) => (
  <div style={styles.nowrap}>
    <ProgressButton
      text={i18n.edit()}
      onClick={onEdit}
      color={ProgressButton.ButtonColor.gray}
    />
    {canDelete && (
      <ProgressButton
        style={{marginLeft: 5}}
        text={i18n.delete()}
        onClick={onDelete}
        color={ProgressButton.ButtonColor.red}
      />
    )}
  </div>
);
EditOrDelete.propTypes = {
  canDelete: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

/**
 * Buttons for confirming whether or not we want to delete a section
 */
export const ConfirmDelete = ({onClickYes, onClickNo}) => (
  <div style={styles.nowrap}>
    <div>{i18n.deleteConfirm()}</div>
    <ProgressButton
      text={i18n.yes()}
      onClick={onClickYes}
      color={ProgressButton.ButtonColor.red}
    />
    <ProgressButton
      text={i18n.no()}
      style={styles.rightButton}
      onClick={onClickNo}
      color={ProgressButton.ButtonColor.gray}
    />
  </div>
);
ConfirmDelete.propTypes = {
  onClickYes: PropTypes.func.isRequired,
  onClickNo: PropTypes.func.isRequired,
};

/**
 * Buttons for committing or canceling a save.
 */
export const ConfirmSave = ({onClickSave, onCancel}) => (
  <div style={styles.nowrap}>
    <ProgressButton
      className="uitest-save"
      text={i18n.save()}
      onClick={onClickSave}
      color={ProgressButton.ButtonColor.blue}
    />
    <ProgressButton
      text={i18n.dialogCancel()}
      style={styles.rightButton}
      onClick={onCancel}
      color={ProgressButton.ButtonColor.gray}
    />
  </div>
);
ConfirmSave.propTypes = {
  onClickSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

/**
 * A component for displaying and editing information about a particular section
 * in the teacher dashboard.
 */
class SectionRow extends Component {
  static propTypes = {
    sectionId: PropTypes.number.isRequired,
    lightRow: PropTypes.bool.isRequired,
    handleEdit: PropTypes.func,

    // redux provided
    validLoginTypes: PropTypes.arrayOf(
      PropTypes.oneOf(_.values(SectionLoginType))
    ).isRequired,
    validAssignments: PropTypes.objectOf(assignmentShape).isRequired,
    sections: PropTypes.objectOf(sectionShape).isRequired,
    updateSection: PropTypes.func.isRequired,
    removeSection: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      deleting: false
    };
  }

  onClickDelete = () => this.setState({deleting: true});

  onClickDeleteNo = () => this.setState({deleting: false});

  onClickDeleteYes = () => {
    const { sections, sectionId, removeSection } = this.props;
    const section = sections[sectionId];
    $.ajax({
      url: `/v2/sections/${section.id}`,
      method: 'DELETE',
    }).done(() => {
      removeSection(section.id);
    }).fail((jqXhr, status) => {
      // We may want to handle this more cleanly in the future, but for now this
      // matches the experience we got in angular
      alert(i18n.unexpectedError());
      console.error(status);
    });
  }

  onClickEdit = () => {
    const section = this.props.sections[this.props.sectionId];
    const editData = {
      name: section.name,
      grade: section.grade,
      course: section.course_id,
      extras: section.stageExtras,
      pairing: section.pairingAllowed,
      sectionId: this.props.sectionId
    };
    this.props.handleEdit(editData);
  }

  onClickEditSave = () => {
    const { sections, sectionId, updateSection } = this.props;
    const section = sections[sectionId];
    const persistedSection = !!section.code;
    const assignment = this.assignment.getSelectedAssignment();
    const data = {
      id: persistedSection ? sectionId : null,
      name: this.name.value,
      login_type: this.loginType.value,
      grade: this.grade.value,
      stage_extras: this.stageExtras.checked,
      pairing_allowed: this.pairingAllowed.checked,
      course_id: assignment ? assignment.courseId : null,
    };

    // We used to have some additional logic that would display a string
    // (dashboard_sections_assign_hoc_script_msg) when assigning a HOC script
    // just before HOC. If we end up needing that again in the future, we'll need
    // to port that here.

    // Due in part to it's angular history, this API expects {script: { id }}
    // instead of script_id
    if (assignment && assignment.scriptId) {
      data.script = {
        id: assignment.scriptId
      };
    }

    const suffix = persistedSection ? `/${sectionId}/update` : '';

    $.ajax({
      url: `/v2/sections${suffix}`,
      method: 'POST',
      contentType: 'application/json;charset=UTF-8',
      data: JSON.stringify(data),
    }).done(result => {
      updateSection(sectionId, result);
    }).fail((jqXhr, status) => {
      // We may want to handle this more cleanly in the future, but for now this
      // matches the experience we got in angular
      alert(i18n.unexpectedError());
      console.error(status);
    });
  }

  onClickEditCancel = () => {
    const { sections, sectionId, removeSection } = this.props;
    const section = sections[sectionId];
    const persistedSection = !!section.code;
    if (!persistedSection) {
      removeSection(section.id);
    }
  }

  render() {
    const {
      lightRow,
      sections,
      sectionId,
      validAssignments,
    } = this.props;
    const { deleting } = this.state;

    const section = sections[sectionId];
    if (!section) {
      return null;
    }
    const assignNames = assignmentNames(validAssignments, section);
    const assignPaths = assignmentPaths(validAssignments, section);

    const persistedSection = !!section.code;

    return (
      <tr
        style={{
          ...(lightRow ? styles.lightRow : styles.darkRow),
          ...styles.row
        }}
      >
        <td style={styles.col}>
          <a href={`#/sections/${section.id}/`} style={styles.link}>
            {section.name}
          </a>
        </td>
        <td style={styles.col}>
          {section.loginType}
        </td>
        <td style={styles.col}>
          {section.grade}
        </td>
        <td style={{...styles.col, ...styles.courseCol}}>
          {assignNames[0] &&
            <a href={assignPaths[0]} style={styles.link}>
              {assignNames[0]}
            </a>
          }
          {assignNames[1] &&
            <div style={styles.currentUnit}>
              {i18n.currentUnit()}
              <div>
                <a href={assignPaths[1]} style={styles.link}>
                  {assignNames[1]}
                </a>
              </div>
            </div>
          }
        </td>
        <td style={styles.col}>
          {(section.stageExtras ? i18n.yes() : i18n.no())}
        </td>
        <td style={styles.col}>
          {(section.pairingAllowed ? i18n.yes() : i18n.no())}
        </td>
        <td style={styles.col}>
          {persistedSection &&
            <a href={`#/sections/${section.id}/manage`} style={styles.link}>
              {section.studentCount}
            </a>
          }
        </td>
        <td style={styles.col}>
          {section.code}
        </td>
        <td style={styles.col}>
          {!deleting && (
            <EditOrDelete
              canDelete={section.studentCount === 0}
              onEdit={this.onClickEdit}
              onDelete={this.onClickDelete}
            />
          )}
          {deleting && (
            <ConfirmDelete
              onClickYes={this.onClickDeleteYes}
              onClickNo={this.onClickDeleteNo}
            />
          )}
          <PrintCertificates
            sectionId={section.id}
            assignmentName={assignNames[0]}
          />
        </td>
      </tr>
    );
  }
}

export const UnconnectedSectionRow = SectionRow;

export default connect(state => ({
  validLoginTypes: state.teacherSections.validLoginTypes,
  validAssignments: state.teacherSections.validAssignments,
  sections: state.teacherSections.sections,
}), { updateSection, removeSection })(SectionRow);

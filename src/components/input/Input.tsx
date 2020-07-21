import classNames from 'classnames';
import { isEmpty } from 'lodash';
import React from 'react';
import { ValidatorFn } from 'core/validators/validators';
import Icon from '../icon';
import shortid from 'shortid';
import styled from 'styled-components';

type InputProps = {
  validator?: ValidatorFn | Array<ValidatorFn>;
  dirty?: boolean;
  touched?: boolean;
  label?: string;
  id?: string;
  tooltip?: string;
  tooltipCloseLabel?: string;
  errors?: { [id: string]: string };
  onValidationChanged?: (boolean) => any;
  onChange?: (string) => any;
  value?: string;
  placeholder?: string;
};

const InputHeader = styled.div`
  display: flex;
  align-items: center;
`;

const InputTooltip = styled.div`
  display: inline-block;
  margin-left: auto;
  font-size: 16px;
`;

export default class Input extends React.Component<InputProps> {
  private ariaId: string;

  public state: any = {
    dirty: false,
    touched: false,
    isValid: true,
    value: this.props.value || '',
    errorMessages: []
  };
  constructor(props) {
    super(props);
    this.ariaId = `hint-${shortid.generate()}`;
  }

  get touched() {
    return this.state.touched || this.props.touched;
  }

  get dirty() {
    return this.state.dirty || this.props.dirty;
  }

  componentDidMount() {
    const { dirty, touched } = this.props;
    if (dirty || touched) {
      this.resetErrors();
    }
  }

  componentDidUpdate(prevProps) {
    const { dirty, touched } = this.props;

    const isDirtyUpdated = prevProps.dirty !== dirty;
    const isTouchedUpdated = prevProps.touched !== touched;
    if (isDirtyUpdated || isTouchedUpdated) {
      this.resetErrors();
    }
  }

  onChange(evt) {
    const newValue = evt.target.value;
    this.setState({ dirty: true, value: newValue }, () =>
      this.validateAndUpdateState(newValue)
    );

    if (this.props.onChange) {
      this.props.onChange(newValue);
    }
  }

  onBlur(): void {
    this.setState({ touched: true }, () =>
      this.validateAndUpdateState(this.state.value)
    );
  }

  private resetErrors() {
    this.setState({ dirty: false, touched: false }, () =>
      this.validateAndUpdateState(this.state.value)
    );
  }

  reset() {
    const { value } = this.props;
    const defaultValue = value || '';
    this.setState({ value: defaultValue });
    this.resetErrors();
    if (this.props.onChange) {
      this.props.onChange(defaultValue);
    }
  }

  // force validation refresh, and return isValid state when triggered (used in Elements form before submission)
  async refreshValidation(): Promise<boolean> {
    return new Promise(resolve => {
      this.setState({ dirty: true, touched: true }, async () => {
        this.validate(this.state.value).then(errorMessages => {
          this.setState({ errorMessages });
          const { isValid } = this.state;
          resolve(isValid);
        });
      });
    });
  }

  private validateAndUpdateState(value: string): void {
    this.validate(value).then(errorMessages => {
      this.setState({ errorMessages });
    });
  }

  private async validate(value: string): Promise<string[]> {
    let errors;
    let valid = true;
    const errorMessages = [];
    if ((this.dirty || this.touched) && this.props.validator) {
      if (this.props.validator instanceof Array) {
        const errorsMap = await Promise.all(
          this.props.validator.map(validator => validator(value))
        );
        errors = errorsMap.reduce((prev, curr) => ({ ...prev, ...curr }), {});
      } else {
        errors = await this.props.validator(value);
      }
      valid = !errors || isEmpty(errors);
      if (this.props.onValidationChanged) {
        this.props.onValidationChanged(valid);
      }
    }
    if (!valid && this.props.errors) {
      Object.entries(errors).forEach(([errorId, errorVal]) => {
        if (errorVal) {
          errorMessages.push(this.props.errors[errorId]);
        }
      });
    }
    this.setState({ isValid: valid });
    return errorMessages;
  }

  render() {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const {
      id,
      touched,
      validator,
      dirty,
      label,
      tooltip,
      tooltipCloseLabel,
      errors,
      onValidationChanged,
      onChange,
      value,
      ...rest
    } = this.props;
    /* eslint-enable @typescript-eslint/no-unused-vars */

    const { errorMessages } = this.state;
    return (
      <div
        className={classNames('tk-input-group', {
          'tk-input-group--error': errorMessages.length
        })}
      >
        {label || tooltip ? (
          <InputHeader className="tk-input-group__header">
            {label ? (
              <label className="tk-label" htmlFor={id}>
                {label}
              </label>
            ) : null}
            {tooltip ? (
              <InputTooltip>
                <Icon
                  iconName="info-round"
                  tooltip={{
                    id: this.ariaId,
                    description: tooltip,
                    closeLabel: tooltipCloseLabel
                  }}
                />
              </InputTooltip>
            ) : null}
          </InputHeader>
        ) : null}
        <input
          id={id}
          aria-describedby={tooltip && this.ariaId}
          className="tk-input"
          value={this.state.value}
          onBlur={() => this.onBlur()}
          onChange={evt => this.onChange(evt)}
          {...rest}
        />
        {errorMessages.map((errMsg, i) => (
          <div className="tk-input-error" key={i}>
            {errMsg}
          </div>
        ))}
      </div>
    );
  }
}

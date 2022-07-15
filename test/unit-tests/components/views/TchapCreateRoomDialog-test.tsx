
import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import TchapCreateRoomDialog from "../../../../src/components/views/dialogs/TchapCreateRoomDialog";


describe("TchapCreateRoomDiaglog", () => {
    
    const defaultProps = {
        onFinished: jest.fn(),
        checkPrivateKey: jest.fn(),
        keyInfo: undefined,
    };

    const getComponent = (props ={}): ReactWrapper =>
            mount(<TchapCreateRoomDialog {...defaultProps} {...props} />);

    
    it("Closes the dialog when the form is submitted with valid values", async () => {
        const onFinished = jest.fn();
        const checkPrivateKey = jest.fn().mockResolvedValue(true);
        const wrapper = getComponent({ onFinished, checkPrivateKey });
        
        // force into valid state
        act(() => {
            wrapper.setState({
                recoveryKeyValid: true,
                recoveryKey: "a",
            });
        });
        const e = { preventDefault: () => {} };

        act(() => {
            wrapper.find('form').simulate('submit', e);
        });

        //await flushPromises(); needed?

        expect(checkPrivateKey).toHaveBeenCalledWith({ recoveryKey: "a" });
        expect(onFinished).toHaveBeenCalledWith({ recoveryKey: "a" });
    })


})

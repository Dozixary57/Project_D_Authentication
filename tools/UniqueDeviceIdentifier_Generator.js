function UniqueDeviceIdentifier_Generator(userAgentData) {
    const UDI = userAgentData.device.family + userAgentData.os.family + userAgentData.os.major;
    return Buffer.from(UDI).toString('base64');
}

module.exports = UniqueDeviceIdentifier_Generator
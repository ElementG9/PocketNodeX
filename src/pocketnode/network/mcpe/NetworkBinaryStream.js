const UUID = require("../../utils/UUID");
const Vector3 = require("../../math/Vector3");
const Entity = require("../../entity/Entity");

const CommandOriginData = require("./protocol/types/CommandOriginData");


class NetworkBinaryStream extends require("../../../binarystream/BinaryStream") {

    /**
     * @return {string}
     */
    readString(){
        return this.read(this.readUnsignedVarInt()).toString();
    }

    /**
     * @param v {string}
     * @return {NetworkBinaryStream}
     */
    writeString(v){
        this.writeUnsignedVarInt(Buffer.byteLength(v));
        if(v.length === 0){
            return this;
        }
        this.append(Buffer.from(v, "utf8"));
        return this;
    }

    /**
     * @return {UUID}
     */
    readUUID(){
        let [p1, p0, p3, p2] = [this.readLInt(), this.readLInt(), this.readLInt(), this.readLInt()];

        return new UUID(p0, p1, p2, p3);
    }

    /**
     * @param uuid {UUID}
     * @return {NetworkBinaryStream}
     */
    writeUUID(uuid){
        this.writeLInt(uuid.getPart(1))
            .writeLInt(uuid.getPart(0))
            .writeLInt(uuid.getPart(3))
            .writeLInt(uuid.getPart(2));

        return this;
    }

    readEntityUniqueId(){
        return this.readVarLong();
    }

    writeEntityUniqueId(eid){
        this.writeVarLong(eid);
        return this;
    }

    readEntityRuntimeId(){
        return this.readUnsignedVarLong();
    }

    writeEntityRuntimeId(eid){
        this.writeUnsignedVarLong(eid);
        return this;
    }

    readVector3(){
        return new Vector3(
            this.readRoundedLFloat(4),
            this.readRoundedLFloat(4),
            this.readRoundedLFloat(4)
        );
    }

    writeVector3(vector){
        if(vector === null){
            this.writeLFloat(0.0);
            this.writeLFloat(0.0);
            this.writeLFloat(0.0);
            return this;
        }
        this.writeLFloat(vector.x);
        this.writeLFloat(vector.y);
        this.writeLFloat(vector.z);
        return this;
    }

    readEntityMetadata(types = true){
        let count = this.readUnsignedVarInt();
        let data = [];
        for (let i = 0; i < count; ++i){
            let key = this.readUnsignedVarInt();
            let type = this.readUnsignedVarInt();
            let value = null;
            switch (type) {
                case Entity.DATA_TYPE_BYTE:
                    value = this.readByte();
                    break;
                case Entity.DATA_TYPE_SHORT:
                    value = this.readSignedLShort();
                    break;
                case Entity.DATA_TYPE_INT:
                    value = this.readInt();
                    break;
                case Entity.DATA_TYPE_FLOAT:
                    value = this.readLFloat();
                    break;
                case Entity.DATA_TYPE_STRING:
                    value = this.readString();
                    break;
                case Entity.DATA_TYPE_SLOT:
                    //TODO
                    console.log("fuck.. not implemented yet.. ima lazy");
                    break;
                case Entity.DATA_TYPE_POS:
                    value = new Vector3();
                    this.readSignedBlockPosition(value.x, value.y, value.z);
                    break;
                case Entity.DATA_TYPE_LONG:
                    value = this.readVarInt();
                    break;
                case Entity.DATA_TYPE_VECTOR3F:
                    value = this.readVector3();
                    break;
                default:
                    console.log(`Invalid data type " . ${type}`);
            }
            if (types){
                data[key] = [type, value];
            } else {
                data[key] = value;
            }
        }

        return data;
    }

    writeEntityMetadata(metadata) {
        this.writeUnsignedVarInt(metadata.length);
        metadata.forEach(key => {
            for (let d in key) {
                if (key.hasOwnProperty(d)) {
                    this.writeUnsignedVarInt(key);
                    this.writeUnsignedVarInt(d[0]);
                    switch (d[0]) {
                        case Entity.DATA_TYPE_BYTE:
                            this.writeByte(d[1]);
                            break;
                        case Entity.DATA_TYPE_SHORT:
                            this.writeLShort(d[1]);
                            break;
                        case Entity.DATA_TYPE_INT:
                            this.writeVarInt(d[1]);
                            break;
                        case Entity.DATA_TYPE_FLOAT:
                            this.writeLFloat(d[1]);
                            break;
                        case Entity.DATA_TYPE_STRING:
                            this.writeString(d[1]);
                            break;
                        case Entity.DATA_TYPE_SLOT:
                            //TODO: this.writeSlot(d[1]);
                            break;
                        case Entity.DATA_TYPE_POS:
                            let v = d[1];
                            if (v !== null) {
                                //TODO: here ahead
                            }
                            break;
                        case Entity.DATA_TYPE_LONG:
                            this.writeVarInt(d[1]);
                            break;
                        case Entity.DATA_TYPE_VECTOR3F:
                            this.writeVector3(d[1]); //TODO: make nullable
                    }
                }
            }
        });
    }

    writeByteRotation(rotation){
        this.writeByte(Math.floor(rotation / (360/256)));
        return this;
    }

    readByteRotation(){
        return (this.readByte() * (360/256));
    }

    readSlot(){
        //TODO
        let id = this.readVarInt();
        if(id === 0){
            return null; //Change to AIR.
        }
        console.error("readSlot used but not implemented.");
    }

    writeSlot(data){
        console.error("writeSlot used but not implemented.");
        return this;
        //TODO
    }

    readEntityLink(){
        // let link = new EntityLink();
        // link.fromEntityUniqueId = this.readEntityUniqueId();
        // link.toEntityUniqueId = this.readEntityUniqueId();
        // link.type = this.readByte();
        // link.immediate = this.readBool();
        // return link;
    }

    writeEntityLink(link){
        this.writeEntityUniqueId(link.fromEntityUniqueId);
        this.writeEntityUniqueId(link.toEntityUniqueId);
        this.writeByte(link.type);
        this.writeBool(link.immediate);
    }

    readBlockPosition(){
        return [
            this.readVarInt(),
            this.readUnsignedVarInt(),
            this.readVarInt()
        ];
    }

    writeBlockPosition(x, y, z){
        this.writeVarInt(x)
            .writeUnsignedVarInt(y)
            .writeVarInt(z);
        return this;
    }

    readSignedBlockPosition(x, y, z){
        return [
            this.readVarInt(),
            this.readVarInt(),
            this.readVarInt()
        ]
    }

    writeSignedBlockPosition(x, y, z){
        this.writeVarInt(x);
        this.writeVarInt(y);
        this.writeVarInt(z);
    }

    readGameRules(){
        let count = this.readUnsignedVarInt();
        let rules = [];
        for(let i = 0; i < count; ++i){
            let name = this.readString();
            let type = this.readUnsignedVarInt();
            let value = null;
            switch(type){
                case 1:
                    value = this.readBool();
                    break;
                case 2:
                    value = this.readUnsignedVarInt();
                    break;
                case 3:
                    value = this.readLFloat();
                    break;
            }

            rules[name] = [type, value];
        }

        return rules;
    }

    writeGameRules(rules){
        this.writeUnsignedVarInt(rules.length);
        rules.forEach(rule => {
            this.writeString(rule.getName());
            if(typeof rule.getValue() === "boolean") {
                this.writeByte(1);
                this.writeBool(rule.getValue());
            }else if(Number.isInteger(rule.getValue())){
                this.writeByte(2);
                this.writeUnsignedVarInt(rule.getValue());
            }else if(typeof rule.getValue() === "number" && !Number.isInteger(rule.getValue())){
                this.writeByte(3);
                this.writeLFloat(rule.getValue());
            }
        });

        return this;
    }

    getCommandOriginData() {
        let result = new CommandOriginData();

        result.type = this.readUnsignedVarInt();
        result.uuid = this.readUUID();
        result.requestId = this.readString();

        if (result.type === CommandOriginData.ORIGIN_DEV_CONSOLE || result.type === CommandOriginData.ORIGIN_TEST) {
            result.varlong1 = this.readVarLong();
        }

        return result;
    }

    /**
     * @param data {CommandOriginData}
     */
    putCommandOriginData(data) {
        this.writeUnsignedVarInt(data.type);
        this.writeUUID(data.uuid);
        this.writeString(data.requestId);

        if (data.type === CommandOriginData.ORIGIN_DEV_CONSOLE || data.type === CommandOriginData.ORIGIN_TEST) {
            this.writeVarLong(data.varlong1);
        }
    }
}

module.exports = NetworkBinaryStream;
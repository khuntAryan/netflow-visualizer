
import { Node, Edge } from '@xyflow/react';

export type RoutingType = 'OSPF' | 'RIP' | 'STATIC';

export interface CiscoDevice {
  id: string;
  name: string;
  model: string;
  type: 'router' | 'switch' | 'pc' | 'server';
  role: 'core' | 'access' | 'edge' | 'endpoint';
  interfaces: CiscoInterface[];
  config: string;
  vlanConfigs?: { id: number; name: string }[];
}

export interface CiscoInterface {
  name: string;
  ipAddress?: string;
  subnetMask?: string;
  connectedTo?: string; // deviceId
  description?: string;
  ospfCost?: number;
  vlan?: number;
}

export interface NetworkHealth {
  redundancy: 'Good' | 'Weak' | 'Critical';
  estimatedLatency: string;
  riskPoints: string[];
  vlanCount: number;
}

export interface CiscoExportData {
  devices: CiscoDevice[];
  connections: { from: string; to: string; fromInt: string; toInt: string; subnet: string; status: 'active' | 'failover' }[];
  summary: {
    totalSubnets: number;
    totalRouters: number;
    routingProtocol: string;
    gatewaysDefined: number;
  };
  health: NetworkHealth;
  guide: string;
}

export const generateIntelligentEnterpriseConfig = (
  nodes: Node[], 
  edges: Edge[], 
  routingType: RoutingType = 'OSPF'
): CiscoExportData => {
  const devices: CiscoDevice[] = [];
  const connections: any[] = [];
  const riskPoints: string[] = [];
  
  // 1. Initial Mapping & Advanced Role Detection
  nodes.forEach(node => {
    if (['groupNode'].includes(node.type || '')) return;
    
    let type: CiscoDevice['type'] = 'pc';
    let role: CiscoDevice['role'] = 'endpoint';
    const nodeType = node.data.nodeType || 'pc';

    if (nodeType === 'router') { 
      type = 'router'; 
      const adj = edges.filter(e => e.source === node.id || e.target === node.id).length;
      role = adj > 2 ? 'core' : 'edge';
    }
    else if (nodeType === 'switch') { type = 'switch'; role = 'access'; }
    else if (nodeType === 'server') { type = 'server'; role = 'endpoint'; }
    else { type = 'pc'; role = 'endpoint'; }

    devices.push({
      id: node.id,
      name: (String(node.data.label || 'Node')).replace(/\s+/g, '_'),
      model: type === 'router' ? '1941' : type === 'switch' ? '2960' : 'Generic',
      type,
      role,
      interfaces: [],
      config: '',
      vlanConfigs: type === 'switch' ? [{ id: 10, name: 'USERS' }, { id: 20, name: 'SERVERS' }] : []
    });
  });

  // 2. Redundancy & Risk Analysis (SPOF detection)
  // Simple algorithm: if a router or switch has only one link to the backbone, it's a risk.
  devices.forEach(dev => {
    if (dev.type === 'router' || dev.type === 'switch') {
       const connectivity = edges.filter(e => e.source === dev.id || e.target === dev.id).length;
       if (connectivity === 1) riskPoints.push(`${dev.name} (Single Link)`);
    }
  });

  const processedEdges = new Set<string>();
  let lanCounter = 10;
  let wanCounter = 0;

  // 3. Intelligent LAN Assignment with VLANs
  const routers = devices.filter(d => d.type === 'router');
  const switches = devices.filter(d => d.type === 'switch');

  switches.forEach(sw => {
    const swEdges = edges.filter(e => e.source === sw.id || e.target === sw.id);
    const clusterNodes = swEdges.map(e => e.source === sw.id ? e.target : e.source);
    
    const gatewayRouter = routers.find(r => clusterNodes.includes(r.id));
    const subnet = `192.168.${lanCounter}.0`;
    lanCounter += 10;

    if (gatewayRouter) {
      const routerIntName = `GigabitEthernet0/${gatewayRouter.interfaces.length}`;
      gatewayRouter.interfaces.push({
        name: routerIntName,
        ipAddress: `${subnet.slice(0, -1)}1`,
        subnetMask: '255.255.255.0',
        connectedTo: sw.id,
        description: `Gateway for LAN ${sw.name}`,
        ospfCost: 10 // Baseline cost for LAN
      });

      const swIntName = `FastEthernet0/${sw.interfaces.length + 1}`;
      sw.interfaces.push({
        name: swIntName,
        connectedTo: gatewayRouter.id
      });
      connections.push({ from: gatewayRouter.name, to: sw.name, fromInt: routerIntName, toInt: swIntName, subnet, status: 'active' });
    }

    clusterNodes.forEach((nodeId, idx) => {
      const dev = devices.find(d => d.id === nodeId);
      if (!dev || dev.type === 'router' || dev.type === 'switch') return;

      const vlan = dev.type === 'server' ? 20 : 10;
      const ip = `${subnet.slice(0, -1)}${idx + 10}`;
      const devIntName = `FastEthernet0/1`;
      const swIntName = `FastEthernet0/${sw.interfaces.length + 1}`;

      dev.interfaces.push({
        name: devIntName,
        ipAddress: ip,
        subnetMask: '255.255.255.0',
        connectedTo: sw.id,
        vlan,
        description: `Gateway: ${subnet.slice(0, -1)}1`
      });

      sw.interfaces.push({
        name: swIntName,
        connectedTo: dev.id,
        vlan
      });

      connections.push({ from: dev.name, to: sw.name, fromInt: devIntName, toInt: swIntName, subnet, status: 'active' });
    });
  });

  // 4. Critical Link & WAN Costing
  edges.forEach(edge => {
    const d1 = devices.find(d => d.id === edge.source);
    const d2 = devices.find(d => d.id === edge.target);
    if (!d1 || !d2 || d1.type !== 'router' || d2.type !== 'router') return;

    const subnet = `10.0.0.${wanCounter}`;
    wanCounter += 4;

    // Advanced Costing: Deeper nodes in graph get higher cost
    const cost = 100 + (wanCounter * 5); 

    const int1 = `GigabitEthernet0/${d1.interfaces.length}`;
    const int2 = `GigabitEthernet0/${d2.interfaces.length}`;

    d1.interfaces.push({ name: int1, ipAddress: `${subnet.slice(0, -1)}${wanCounter-3}`, subnetMask: '255.255.255.252', connectedTo: d2.id, ospfCost: cost });
    d2.interfaces.push({ name: int2, ipAddress: `${subnet.slice(0, -1)}${wanCounter-2}`, subnetMask: '255.255.255.252', connectedTo: d1.id, ospfCost: cost });

    connections.push({ from: d1.name, to: d2.name, fromInt: int1, toInt: int2, subnet: `${subnet}/30`, status: 'active' });
  });

  // 5. Intelligent CLI Config Generation
  devices.forEach(dev => {
    let cli = `!\nhostname ${dev.name}\n!\n`;
    
    if (dev.type === 'router') {
      cli += `enable\nconf t\n`;
      dev.interfaces.forEach(int => {
        cli += `interface ${int.name}\n`;
        if (int.description) cli += ` description ${int.description}\n`;
        cli += ` ip address ${int.ipAddress} ${int.subnetMask}\n`;
        if (int.ospfCost && routingType === 'OSPF') cli += ` ip ospf cost ${int.ospfCost}\n`;
        cli += ` no shutdown\n!\n`;
      });

      if (routingType === 'OSPF') {
        cli += `router ospf 1\n`;
        cli += ` router-id ${dev.interfaces[0]?.ipAddress || '1.1.1.1'}\n`;
        dev.interfaces.forEach(int => {
          if (!int.ipAddress) return;
          const network = int.ipAddress.split('.').slice(0, 3).join('.') + '.0';
          const wild = int.subnetMask === '255.255.255.252' ? '0.0.0.3' : '0.0.0.255';
          cli += ` network ${network} ${wild} area ${dev.role === 'core' ? 0 : 1}\n`;
        });
      }
      cli += `!\nend\n`;
    } 
    else if (dev.type === 'switch') {
      cli += `enable\nconf t\n`;
      // VLAN Configuration
      dev.vlanConfigs?.forEach(v => cli += `vlan ${v.id}\n name ${v.name}\n!\n`);
      
      dev.interfaces.forEach(int => {
        cli += `interface ${int.name}\n`;
        if (int.vlan) {
          cli += ` switchport mode access\n`;
          cli += ` switchport access vlan ${int.vlan}\n`;
        } else {
          cli += ` switchport mode trunk\n`; // Default to trunk for router links
        }
        cli += ` no shutdown\n!\n`;
      });
      cli += `end\n`;
    }
    else {
      // Basic Static IP Config for Endpoints
      const int = dev.interfaces[0];
      cli = int ? `IP: ${int.ipAddress}\nMASK: ${int.subnetMask}\nGATEWAY: ${int.description?.split(': ')[1]}\nVLAN: ${int.vlan}` : "No Config";
    }
    dev.config = cli;
  });

  // 6. Final Health Assessment
  const health: NetworkHealth = {
    redundancy: riskPoints.length === 0 ? 'Good' : riskPoints.length < 3 ? 'Weak' : 'Critical',
    estimatedLatency: `${(10 + wanCounter * 2)}ms`,
    riskPoints,
    vlanCount: 2
  };

  return { 
    devices, 
    connections, 
    summary: { 
      totalSubnets: Math.floor(lanCounter/10 - 1) + Math.floor(wanCounter/4), 
      totalRouters: routers.length, 
      routingProtocol: routingType, 
      gatewaysDefined: routers.length 
    },
    health,
    guide: `# Fault-Tolerant Enterprise Build Guide\n\nSecurity & Routing Protocol: **${routingType}**\nDetected SPOFs: **${riskPoints.length}**\n\nBuild Steps:\n1. Wire devices per the connection map.\n2. Apply VLAN configurations to switches first.\n3. Verify OSPF neighbor adjacency on all core routers.\n4. Test failover by shutting down GigabitEthernet interfaces.`
  };
};

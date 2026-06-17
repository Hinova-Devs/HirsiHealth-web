const projectId = 'f44c41b8-4018-4487-a3ce-4dbcafea1e2f';
const clientId = '2ea4d3b6-e28e-4c6e-9d08-96854e8e031b';

async function testAuth() {
  const body = {
    email: 'demo_patient@hersihealth.so',
    password: 'DemoPatient123!',
    projectId,
    clientId
  };

  console.log('Sending request to Medplum Cloud with:', body);

  try {
    const res = await fetch('https://api.medplum.com/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    console.log('Response status:', res.status, res.statusText);
    const data = await res.json();
    console.log('Response body:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error during fetch:', err);
  }
}

testAuth();

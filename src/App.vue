<template>
  <div class="app">
    <h1 class="title">Investment Packages</h1>

    <div class="packages">
      <div
        v-for="pkg in packages"
        :key="pkg.id"
        class="package-card"
      >
        <!-- Image placeholder -->
        <div class="image-placeholder">
          Image
        </div>

        <h2>{{ pkg.name }}</h2>

        <p>
          Investment:
          <strong>KES {{ pkg.investment.toLocaleString() }}</strong>
        </p>

        <p>
          Daily Return:
          <strong>KES {{ pkg.daily }}</strong>
        </p>

        <p class="yearly">
          Yearly Earnings:
          <strong>KES {{ yearly(pkg.daily).toLocaleString() }}</strong>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
const packages = [
  {
    id: 1,
    name: "Package 1",
    investment: 1200,
    daily: 75
  },
  {
    id: 2,
    name: "Package 2",
    investment: 2400,
    daily: 160
  },
  {
    id: 3,
    name: "Package 3",
    investment: 3900,
    daily: 288
  },
  {
    id: 4,
    name: "Package 4",
    investment: 6500,
    daily: 516
  }
];

const yearly = (daily) => daily * 365;
</script>

<style scoped>
.app {
  padding: 40px 20px;
  max-width: 1200px;
  margin: auto;
  font-family: Arial, Helvetica, sans-serif;
}

.title {
  text-align: center;
  margin-bottom: 30px;
  font-size: 2rem;
}

.packages {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

.package-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 20px;
  text-align: center;
  border: 1px solid #e5e7eb;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.05);
}

.package-card h2 {
  margin: 10px 0;
  font-size: 1.3rem;
}

.package-card p {
  margin: 6px 0;
  color: #374151;
}

.yearly {
  margin-top: 10px;
  font-size: 1.05rem;
  color: #065f46;
}

.image-placeholder {
  height: 160px;
  background: #e5e7eb;
  border-radius: 10px;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-weight: bold;
}
</style>
